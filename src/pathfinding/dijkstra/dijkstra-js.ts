import { injectable } from "inversify";
import TinyQueue from "tinyqueue";
import { DistanceM, DurationMs } from "../../interfaces/units";
import PathfindingGraph from "../graph";
import { IPathSummary, IShortestPathAlgorithm } from "../pathfinder";

interface IState {
    position: number;
    distance: DistanceM;
    duration: DurationMs;
    cost: number;
}

interface IBreakPointIndex {
    [position: number]: (on: string) => Promise<void>;
}

@injectable()
export class Dijkstra implements IShortestPathAlgorithm {
    private graph: PathfindingGraph;
    private useWeightedCost: boolean;
    private breakPoints: IBreakPointIndex;
    private costs: number[];
    private previousNodes: number[];

    constructor() {
        this.graph = new PathfindingGraph();
        this.useWeightedCost = true;
        this.breakPoints = {};
    }

    public setUseWeightedCost(useWeightedCost: boolean) {
        this.useWeightedCost = useWeightedCost;
    }

    public setGraph(graph: PathfindingGraph) {
        this.graph = graph;
    }

    public setBreakPoint(on: string, callback: (on: string) => Promise<void>): void {
        const position = this.graph.getNodeIndex(on);
        this.breakPoints[position] = callback;
    }

    public removeBreakPoint(on: string): void {
        const position = this.graph.getNodeIndex(on);
        delete this.breakPoints[position];
    }

    public async queryPathSummary(from: string, to: string): Promise<IPathSummary> {
        const costs = [...Array(this.graph.getAdjacencyList().length)].map((_) => Infinity);

        let queue: TinyQueue<IState>;
        if (this.useWeightedCost) {
            queue = new TinyQueue([], (a, b) => a.cost - b.cost);
        } else {
            queue = new TinyQueue([], (a, b) => a.duration - b.duration);
        }

        const fromIndex = this.graph.getNodeIndex(from);
        costs[fromIndex] = 0;
        queue.push({ position: fromIndex, duration: 0, cost: 0, distance: 0 });

        const toIndex = this.graph.getNodeIndex(to);

        while (queue.length) {
            const { duration, distance, cost, position } = queue.pop();

            if (position === toIndex) {
                return { duration, distance, cost };
            }

            if (cost > costs[position]) {
                // we have already found a better way
                continue;
            }

            if (this.breakPoints[position]) {
                await this.breakPoints[position](this.graph.getLabel(position));
            }

            for (const edge of this.graph.getAdjacencyList()[position]) {
                const next = {
                    distance: distance + edge.distance,
                    duration: duration + edge.duration,
                    cost: cost + edge.cost,
                    position: edge.node,
                };

                if (next.cost < costs[next.position]) {
                    queue.push(next);
                    costs[next.position] = next.cost;
                }
            }
        }

        return undefined;
    }

    public async queryPath(from: string, to: string) {
        let queue: TinyQueue<IState>;
        if (this.useWeightedCost) {
            queue = new TinyQueue([], (a, b) => a.cost - b.cost);
        } else {
            queue = new TinyQueue([], (a, b) => a.duration - b.duration);
        }

        this.costs = [...Array(this.graph.getAdjacencyList().length)].fill(Infinity);
        this.previousNodes = [...Array(this.graph.getAdjacencyList().length)].fill(undefined);

        const fromIndex = this.graph.getNodeIndex(from);
        this.costs[fromIndex] = 0;
        queue.push({ distance: 0, duration: 0, cost: 0, position: fromIndex });

        const toIndex = this.graph.getNodeIndex(to);

        while (queue.length) {
            const { duration, distance, cost, position } = queue.pop();

            if (position === toIndex) {
                // it is done, break the loop and start reconstructing the path
                break;
            }

            if (cost > this.getCost[position]) {
                // we have already found a better way
                continue;
            }

            if (this.breakPoints[position]) {
                await this.breakPoints[position](this.graph.getLabel(position));
            }

            for (const edge of this.graph.getAdjacencyList()[position]) {
                const next = {
                    distance: distance + edge.distance,
                    duration: duration + edge.duration,
                    cost: cost + edge.cost,
                    position: edge.node,
                };

                if (next.cost < this.getCost(next.position)) {
                    queue.push(next);
                    this.costs[next.position] = next.cost;
                    this.previousNodes[next.position] = position;
                }
            }
        }

        let currentPosition = toIndex;
        const steps = [];

        // reconstruct the path
        while (this.previousNodes[currentPosition]) {
            const previousPosition = this.previousNodes[currentPosition];

            for (const edge of this.graph.getAdjacencyList()[previousPosition]) {
                // this seems inefficient, but memory consumption is way more important
                if (edge.node === currentPosition) {
                    const distance = edge.distance;
                    const duration = edge.duration;

                    steps.push({
                        from: this.graph.getLabel(previousPosition),
                        to: this.graph.getLabel(currentPosition),
                        distance,
                        duration,
                    });

                    break;
                }
            }

            currentPosition = previousPosition;
        }

        return steps.reverse();
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
