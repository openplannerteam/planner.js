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

@injectable()
export class Dijkstra implements IShortestPathAlgorithm {
    private graph: PathfindingGraph;
    private useWeightedCost: boolean;

    constructor() {
        this.graph = new PathfindingGraph();
        this.useWeightedCost = true;
    }

    public setUseWeightedCost(useWeightedCost: boolean) {
        this.useWeightedCost = useWeightedCost;
    }

    public setGraph(graph: PathfindingGraph) {
        this.graph = graph;
    }

    public queryPathSummary(from: string, to: string): IPathSummary {
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
}
