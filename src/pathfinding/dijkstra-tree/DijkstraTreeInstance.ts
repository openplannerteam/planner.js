import { injectable } from "inversify";
import TinyQueue from "tinyqueue";
import { DistanceM, DurationMs } from "../../interfaces/units";
import PathfindingGraph from "../graph";
import { IPathTree, IShortestPathTreeInstance } from "../pathfinder";

interface IState {
    position: number;
    distance: DistanceM;
    duration: DurationMs;
    cost: number;
}

@injectable()
export default class DijkstraTreeInstance implements IShortestPathTreeInstance {
    private nextQueue: IState[];
    private costs: number[];
    private previousNodes: number[];
    private graph: PathfindingGraph;
    private useWeightedCost: boolean;

    constructor(graph: PathfindingGraph) {
        this.graph = graph;
        this.useWeightedCost = true;
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

    public async start(from: string, maxCost: number): Promise<IPathTree> {
        this.costs = [...Array(this.graph.getAdjacencyList().length)].fill(Infinity);
        this.previousNodes = [...Array(this.graph.getAdjacencyList().length)].fill(undefined);

        const fromIndex = this.graph.getNodeIndex(from);
        this.costs[fromIndex] = 0;
        this.nextQueue = [{ distance: 0, duration: 0, cost: 0, position: fromIndex }];

        return this.continue(maxCost);
    }

    public async continue(maxCost: number): Promise<IPathTree> {
        const queue = new TinyQueue(this.nextQueue, (a, b) => a.duration - b.duration);
        this.nextQueue = [];

        while (queue.length) {
            const { position, distance, duration, cost } = queue.pop();

            if (duration > this.getCost(position)) {
                // we have already found a better way
                continue;
            }

            if (this.graph.getBreakPoint(position)) {
                await this.graph.getBreakPoint(position)(this.graph.getLabel(position));
            }

            if (cost > maxCost) {
                // remember this state for subsequent calls
                this.nextQueue.push({ duration, distance, cost, position });
            } else {
                for (const edge of this.graph.getAdjacencyList()[position]) {
                    const next = {
                        distance: distance + edge.distance,
                        duration: duration + edge.duration,
                        cost: cost + edge.cost,
                        position: edge.node,
                        previousPosition: position,
                    };

                    if (next.duration < this.getCost(next.position)) {
                        queue.push(next);
                        this.costs[next.position] = next.duration;
                        this.previousNodes[next.position] = position;

                        if (this.graph.getBreakPoint(next.position)) {
                            this.graph.getBreakPoint(next.position)(this.graph.getLabel(next.position));
                        }
                    }
                }
            }
        }

        const result: IPathTree = {};

        for (const [position, cost] of this.costs.entries()) {
            const label = this.graph.getLabel(position);
            const previousLabel = this.graph.getLabel(this.previousNodes[position]);
            result[label] = { duration: cost, previousNode: previousLabel };
        }

        return result;
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
