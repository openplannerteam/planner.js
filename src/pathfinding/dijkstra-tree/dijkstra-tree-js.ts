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

@injectable()
export default class DijkstraTree implements IShortestPathTreeAlgorithm {
  private nextQueue: IState[];
  private costs: number[];
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

  public start(from: string, maxCost: number): IPathTree {
    this.costs = [];

    const fromIndex = this.graph.getNodeIndex(from);
    this.costs[fromIndex] = 0;
    this.nextQueue = [{ distance: 0, duration: 0, cost: 0, position: fromIndex }];

    return this.continue(maxCost);
  }

  public continue(maxCost: number): IPathTree {
    const missingCosts = this.graph.getAdjacencyList().length - this.costs.length;
    this.costs = this.costs.concat([...Array(missingCosts)].map((_) => Infinity));

    const queue = new TinyQueue(this.nextQueue, (a, b) => a.cost - b.cost);
    this.nextQueue = [];

    while (queue.length) {
      const { position, distance, duration, cost } = queue.pop();

      if (cost > this.costs[position]) {
        // we have already found a better way
        continue;
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
          };

          if (next.cost < this.costs[next.position]) {
            queue.push(next);
            this.costs[next.position] = next.cost;
          }
        }
      }
    }

    const result: IPathTree = {};

    for (const [position, cost] of this.costs.entries()) {
      if (cost !== Infinity) {
        const label = this.graph.getLabels()[position];
        result[label] = cost;
      }
    }

    return result;
  }
}
