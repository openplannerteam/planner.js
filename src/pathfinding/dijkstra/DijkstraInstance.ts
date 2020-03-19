import { injectable } from "inversify";
import TinyQueue from "tinyqueue";
import { DistanceM, DurationMs } from "../../interfaces/units";
import PathfindingGraph from "../graph";
import { IShortestPathInstance } from "../pathfinder";

const POSITION = 0;
const DISTANCE = 1;
const DURATION = 2;
const COST = 3;

/*
interface IState {
    position: number;
    distance: DistanceM;
    duration: DurationMs;
    cost: number;
}duration
*/

@injectable()
export class DijkstraInstance implements IShortestPathInstance {
    private graph: PathfindingGraph;
    private useWeightedCost: boolean;
    private costs: Float32Array;
    private previousNodes: Float32Array;

    constructor(graph: PathfindingGraph) {
        this.useWeightedCost = true;
        this.graph = graph;
        this.costs = new Float32Array();
        this.previousNodes = new Float32Array();
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
        let queue: TinyQueue<Float32Array>;
        if (this.useWeightedCost) {
            queue = new TinyQueue([], (a, b) => a[COST] - b[COST]);
        } else {
            queue = new TinyQueue([], (a, b) => a[DURATION] - b[DURATION]);
        }

        this.costs = this.costs.fill(Infinity);
        this.previousNodes = this.previousNodes.fill(undefined);

        const fromIndex = this.graph.getNodeIndex(from);
        this.setCost(fromIndex, 0);
        const state = new Float32Array(4);
        state[COST] = 0;
        state[POSITION] = fromIndex;
        state[DISTANCE] = 0;
        state[DURATION] = 0;
        queue.push(state);

        const toIndex = this.graph.getNodeIndex(to);

        while (queue.length) {
            const [position, distance, duration, cost] = queue.pop();

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
                const next = new Float32Array(4);
                next[COST] = cost + edge.cost;
                next[POSITION] = edge.node;
                next[DISTANCE] = distance + edge.distance;
                next[DURATION] = duration + edge.duration;

                /*const next = {
                    distance: distance + edge.distance,
                    duration: duration + edge.duration,
                    cost: Math.fround(cost + edge.cost),
                    position: edge.node,
                };*/

                if (next[COST] < this.getCost(next[POSITION])) {
                    this.setCost(next[POSITION], next[COST]);
                    this.previousNodes[next[POSITION]] = position;
                    queue.push(next);
                }
            }
        }

        let currentPosition = toIndex;
        const steps = [];

        // reconstruct the path
        while (!isNaN(this.previousNodes[currentPosition])) {
            let nextEdge;
            let nextPositionCost = Infinity;
            let way;

            for (const edge of this.graph.getReverseAdjacencyList()[currentPosition]) {
                if (this.getCost(edge.node) < nextPositionCost) {
                    nextPositionCost = this.getCost(edge.node);
                    nextEdge = edge;
                    way = edge.through;
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
                through: way,
            });

            currentPosition = nextEdge.node;
        }

        return steps.reverse();
    }

    private setCost(position: number, cost: number) {
        if (position >= this.costs.length) {
            const newCosts = new Float32Array(this.graph.getAdjacencyList().length)
                .fill(Infinity, this.costs.length);
            newCosts.set(this.costs);
            this.costs = newCosts;

            const newPrevious = new Float32Array(this.graph.getAdjacencyList().length)
                .fill(undefined, this.previousNodes.length);
            newPrevious.set(this.previousNodes);
            this.previousNodes = newPrevious;
        }
        this.costs[position] = cost;
    }

    private getCost(position: number): number {
        if (position >= this.costs.length) {
            const newCosts = new Float32Array(this.graph.getAdjacencyList().length)
                .fill(Infinity, this.costs.length);
            newCosts.set(this.costs);
            this.costs = newCosts;

            const newPrevious = new Float32Array(this.graph.getAdjacencyList().length)
                .fill(undefined, this.previousNodes.length);
            newPrevious.set(this.previousNodes);
            this.previousNodes = newPrevious;
        }
        return this.costs[position];
    }
}
