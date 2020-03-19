import { injectable } from "inversify";
import TinyQueue from "tinyqueue";
import { DistanceM, DurationMs } from "../../interfaces/units";
import PathfindingGraph from "../graph";
import { IShortestPathInstance } from "../pathfinder";

interface IState {
    position: number;
    distance: DistanceM;
    duration: DurationMs;
    cost: number;
}

enum StepResultKind {
    Continue,
    Break,
    NodeHandled,
}

type IStepResult = IContinueStep | IBreakStep | INodeHandledStep;

interface IContinueStep {
    kind: StepResultKind.Continue;
}

interface IBreakStep {
    kind: StepResultKind.Break;
}

interface INodeHandledStep {
    kind: StepResultKind.NodeHandled;
    nodeId: number;
}

@injectable()
export class BidirDijkstraInstance implements IShortestPathInstance {
    /*
    Note that the stopping condition isn't entirely correct.
    It might result in slightly suboptimal results
    but you should only notice the difference on short routes (small number of steps).
    */

    private graph: PathfindingGraph;
    private useWeightedCost: boolean;

    private forwardCosts: number[];
    private backwardCosts: number[];
    private forwardParents: number[];
    private backwardParents: number[];

    constructor(graph: PathfindingGraph) {
        this.useWeightedCost = true;
        this.graph = graph;

        this.forwardCosts = [];
        this.forwardParents = [];
        this.backwardCosts = [];
        this.backwardParents = [];
    }

    public setUseWeightedCost(useWeightedCost: boolean) {
        this.useWeightedCost = useWeightedCost;
    }

    public setBreakPoint(on: string, callback: (on: string) => Promise<void>): void {
        this.graph.setBreakPoint(on, callback);
    }

    public removeBreakPoint(on: string): void {
        this.graph.removeBreakPoint(on);
    }

    public async queryPath(from: string, to: string, maxDistance = Infinity) {
        let forwardQueue: TinyQueue<IState>;
        let backwardQueue: TinyQueue<IState>;
        if (this.useWeightedCost) {
            forwardQueue = new TinyQueue([], (a, b) => a.cost - b.cost);
            backwardQueue = new TinyQueue([], (a, b) => a.cost - b.cost);
        } else {
            forwardQueue = new TinyQueue([], (a, b) => a.duration - b.duration);
            backwardQueue = new TinyQueue([], (a, b) => a.duration - b.duration);
        }

        this.forwardCosts = this.forwardCosts.fill(Infinity);
        this.forwardParents = this.forwardParents.fill(undefined);
        this.backwardCosts = this.backwardCosts.fill(Infinity);
        this.backwardParents = this.backwardParents.fill(undefined);

        const fromIndex = this.graph.getNodeIndex(from);
        const toIndex = this.graph.getNodeIndex(to);
        this.setForwardCost(fromIndex, 0);
        this.setBackwardCost(toIndex, 0);
        forwardQueue.push({ distance: 0, duration: 0, cost: 0, position: fromIndex });
        backwardQueue.push({ distance: 0, duration: 0, cost: 0, position: toIndex });

        while (forwardQueue.length && backwardQueue.length) {
            const [forwardResult, backwardResult] = await Promise.all([
                this.forwardStep(forwardQueue, toIndex, maxDistance),
                this.backwardStep(backwardQueue, fromIndex, maxDistance),
            ]);

            if (forwardResult.kind === StepResultKind.Break || backwardResult.kind === StepResultKind.Break) {
                // failed to find a path
                return [];
            }

            if (forwardResult.kind === StepResultKind.NodeHandled) {
                if (this.backwardCosts[forwardResult.nodeId] < Infinity) {
                    // shortest path has been found
                    // note that it doesn't necessarily contain the handled node
                    return this.constructPath(forwardResult.nodeId);
                }
            }

            if (backwardResult.kind === StepResultKind.NodeHandled) {
                if (this.forwardCosts[backwardResult.nodeId] < Infinity) {
                    return this.constructPath(backwardResult.nodeId);
                }
            }
        }

        // no path found
        return [];
    }

    private constructPath(toIndex: number) {
        let currentPosition = toIndex;
        const forwardSteps = [];
        const backwardSteps = [];

        // reconstruct forward part of the path
        while (this.backwardParents[currentPosition] !== undefined) {
            let nextEdge;
            let nextPositionCost = Infinity;
            let way;

            for (const edge of this.graph.getAdjacencyList()[currentPosition]) {
                if (this.getBackwardCost(edge.node) < nextPositionCost) {
                    nextPositionCost = this.getBackwardCost(edge.node);
                    nextEdge = edge;
                    way = edge.through;
                }
            }

            if (!nextEdge) {
                break;
            }

            backwardSteps.push({
                from: this.graph.getLabel(currentPosition),
                to: this.graph.getLabel(nextEdge.node),
                through: way,
                distance: nextEdge.distance,
                duration: nextEdge.duration,
            });

            currentPosition = nextEdge.node;
        }

        currentPosition = toIndex;
        while (this.forwardParents[currentPosition] !== undefined) {
            let nextEdge;
            let nextPositionCost = Infinity;
            let way;

            for (const edge of this.graph.getReverseAdjacencyList()[currentPosition]) {
                if (this.getForwardCost(edge.node) < nextPositionCost) {
                    nextPositionCost = this.getForwardCost(edge.node);
                    nextEdge = edge;
                    way = edge.through;
                }
            }

            if (!nextEdge) {
                break;
            }

            forwardSteps.push({
                from: this.graph.getLabel(nextEdge.node),
                to: this.graph.getLabel(currentPosition),
                through: way,
                distance: nextEdge.distance,
                duration: nextEdge.duration,
            });

            currentPosition = nextEdge.node;
        }

        return forwardSteps.reverse().concat(backwardSteps);
    }

    private async forwardStep(queue: TinyQueue<IState>, toIndex: number, maxDistance): Promise<IStepResult> {
        if (!queue.length) {
            return { kind: StepResultKind.Break };
        }

        const { duration, distance, cost, position } = queue.pop();

        if (distance > maxDistance) {
            // avoid hopeless searches
            return { kind: StepResultKind.Break };
        }

        if (position === toIndex) {
            // it is done, break the loop and start reconstructing the path
            return { kind: StepResultKind.Break };
        }

        if (cost > this.getForwardCost(position)) {
            // we have already found a better way
            return { kind: StepResultKind.Continue };
        }

        if (this.graph.getBreakPoint(position)) {
            await this.graph.getBreakPoint(position)(this.graph.getLabel(position));
        }

        for (const edge of this.graph.getAdjacencyList()[position]) {
            const next = {
                distance: distance + edge.distance,
                duration: duration + edge.duration,
                cost: cost + edge.cost,
                position: edge.node,
            };

            if (next.cost < this.getForwardCost(next.position)) {
                this.setForwardCost(next.position, next.cost);
                this.forwardParents[next.position] = position;
                queue.push(next);
            }
        }

        return {
            kind: StepResultKind.NodeHandled,
            nodeId: position,
        };
    }

    private async backwardStep(queue: TinyQueue<IState>, toIndex: number, maxDistance): Promise<IStepResult> {
        if (!queue.length) {
            return { kind: StepResultKind.Break };
        }

        const { duration, distance, cost, position } = queue.pop();

        if (distance > maxDistance) {
            // avoid hopeless searches
            return { kind: StepResultKind.Break };
        }

        if (position === toIndex) {
            // it is done, break the loop and start reconstructing the path
            return { kind: StepResultKind.Break };
        }

        if (cost > this.getBackwardCost(position)) {
            // we have already found a better way
            return { kind: StepResultKind.Continue };
        }

        if (this.graph.getBreakPoint(position)) {
            await this.graph.getBreakPoint(position)(this.graph.getLabel(position));
        }

        for (const edge of this.graph.getReverseAdjacencyList()[position]) {
            const next = {
                distance: distance + edge.distance,
                duration: duration + edge.duration,
                cost: cost + edge.cost,
                position: edge.node,
            };

            if (next.cost < this.getBackwardCost(next.position)) {
                this.setBackwardCost(next.position, next.cost);
                this.backwardParents[next.position] = position;
                queue.push(next);
            }
        }

        return {
            kind: StepResultKind.NodeHandled,
            nodeId: position,
        };
    }

    private setForwardCost(position: number, cost: number) {
        if (position >= this.forwardCosts.length) {
            const missingCosts = this.graph.getAdjacencyList().length - this.forwardCosts.length;
            this.forwardCosts = this.forwardCosts.concat([...Array(missingCosts)].fill(Infinity));
            this.forwardParents = this.forwardParents.concat([...Array(missingCosts)].fill(undefined));
        }
        this.forwardCosts[position] = cost;
    }

    private getForwardCost(position: number): number {
        if (position >= this.forwardCosts.length) {
            const missingCosts = this.graph.getAdjacencyList().length - this.forwardCosts.length;
            this.forwardCosts = this.forwardCosts.concat([...Array(missingCosts)].fill(Infinity));
            this.forwardParents = this.forwardParents.concat([...Array(missingCosts)].fill(undefined));
        }
        return this.forwardCosts[position];
    }

    private setBackwardCost(position: number, cost: number) {
        if (position >= this.backwardCosts.length) {
            const missingCosts = this.graph.getAdjacencyList().length - this.backwardCosts.length;
            this.backwardCosts = this.backwardCosts.concat([...Array(missingCosts)].fill(Infinity));
            this.backwardParents = this.backwardParents.concat([...Array(missingCosts)].fill(undefined));
        }
        this.backwardCosts[position] = cost;
    }

    private getBackwardCost(position: number): number {
        if (position >= this.backwardCosts.length) {
            const missingCosts = this.graph.getAdjacencyList().length - this.backwardCosts.length;
            this.backwardCosts = this.backwardCosts.concat([...Array(missingCosts)].fill(Infinity));
            this.backwardParents = this.backwardParents.concat([...Array(missingCosts)].fill(undefined));
        }
        return this.backwardCosts[position];
    }
}
