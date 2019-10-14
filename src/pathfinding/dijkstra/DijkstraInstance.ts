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

@injectable()
export class DijkstraInstance implements IShortestPathInstance {
    private graph: PathfindingGraph;
    private useWeightedCost: boolean;
    private costs: number[];
    private previousNodes: number[];

    constructor(graph: PathfindingGraph) {
        this.useWeightedCost = true;
        this.graph = graph;
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
        let queue: TinyQueue<IState>;
        if (this.useWeightedCost) {
            queue = new TinyQueue([], (a, b) => a.cost - b.cost);
        } else {
            queue = new TinyQueue([], (a, b) => a.duration - b.duration);
        }

        this.costs = [...Array(this.graph.getAdjacencyList().length)].fill(Infinity);
        this.previousNodes = [...Array(this.graph.getAdjacencyList().length)].fill(undefined);

        const fromIndex = this.graph.getNodeIndex(from);
        this.setCost(fromIndex, 0);
        queue.push({ distance: 0, duration: 0, cost: 0, position: fromIndex });

        const toIndex = this.graph.getNodeIndex(to);

        while (queue.length) {
            const { duration, distance, cost, position } = queue.pop();

            if (distance > maxDistance) {
                // avoid hopeless searches
                break;
            }

            if (position === toIndex) {
                // it is done, break the loop and start reconstructing the path
                break;
            }

            if (cost > this.getCost(position)) {
                // we have already found a better way
                continue;
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

                if (next.cost < this.getCost(next.position)) {
                    this.setCost(next.position, next.cost);
                    this.previousNodes[next.position] = position;
                    queue.push(next);
                }
            }
        }

        let currentPosition = toIndex;
        const steps = [];

        // reconstruct the path
        while (this.previousNodes[currentPosition] !== undefined) {
            let nextEdge;
            let nextPositionCost = Infinity;

            for (const edge of this.graph.getReverseAdjacencyList()[currentPosition]) {
                if (this.getCost(edge.node) < nextPositionCost) {
                    nextPositionCost = this.getCost(edge.node);
                    nextEdge = edge;
                }
            }

            if (!nextEdge) {
                break;
            }

            steps.push({
                from: this.graph.getLabel(nextEdge.node),
                to: this.graph.getLabel(currentPosition),
                distance: nextEdge.distance,
                duration: nextEdge.duration,
            });

            currentPosition = nextEdge.node;
        }

        return steps.reverse();
    }

    private setCost(position: number, cost: number) {
        if (position >= this.costs.length) {
            const missingCosts = this.graph.getAdjacencyList().length - this.costs.length;
            this.costs = this.costs.concat([...Array(missingCosts)].fill(Infinity));
            this.previousNodes = this.previousNodes.concat([...Array(missingCosts)].fill(undefined));
        }
        this.costs[position] = cost;
    }

    private getCost(position: number): number {
        if (position >= this.costs.length) {
            const missingCosts = this.graph.getAdjacencyList().length - this.costs.length;
            this.costs = this.costs.concat([...Array(missingCosts)].fill(Infinity));
            this.previousNodes = this.previousNodes.concat([...Array(missingCosts)].fill(undefined));
        }
        return this.costs[position];
    }
}
