import { injectable } from "inversify";
import TinyQueue from "tinyqueue";
import { DistanceM, DurationMs } from "../../interfaces/units";
import PathfindingGraph from "../graph";
import { IPathTree, IShortestPathTreeAlgorithm } from "../pathfinder";

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
export default class DijkstraTree implements IShortestPathTreeAlgorithm {
  private nextQueue: IState[];
  private costs: number[];
  private previousNodes: number[];
  private graph: PathfindingGraph;
  private useWeightedCost: boolean;
  private breakPoints: IBreakPointIndex;

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

      if (this.breakPoints[position]) {
        await this.breakPoints[position](this.graph.getLabel(position));
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

            if (this.breakPoints[next.position]) {
              this.breakPoints[next.position](this.graph.getLabel(next.position));
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
