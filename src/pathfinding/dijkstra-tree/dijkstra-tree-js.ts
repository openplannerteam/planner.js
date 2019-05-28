import { injectable } from "inversify";
import TinyQueue from "tinyqueue";
import { IPathTree, IShortestPathTreeAlgorithm } from "../pathfinder";

interface IEdge {
  node: number;
  cost: number;
}

interface INodeMap {
  [label: string]: number;
}

interface IState {
  position: number;
  cost: number;
}

@injectable()
export default class DijkstraTree implements IShortestPathTreeAlgorithm {
  private nodes: INodeMap;
  private labels: string[];
  private adjacencyList: IEdge[][];

  private nextQueue: IState[];
  private costs: number[];

  constructor() {
    this.nodes = {};
    this.labels = [];
    this.adjacencyList = [];
  }

  public addEdge(from: string, to: string, cost: number) {
    const fromIndex = this.getNodeIndex(from);
    const toIndex = this.getNodeIndex(to);
    this.adjacencyList[fromIndex].push({ node: toIndex, cost });
  }

  public start(from: string, maxCost: number): IPathTree {
    this.costs = [...Array(this.adjacencyList.length)].map((_) => Infinity);

    const fromIndex = this.getNodeIndex(from);
    this.costs[fromIndex] = 0;
    this.nextQueue = [{ cost: 0, position: fromIndex }];

    return this.continue(maxCost);
  }

  public continue(maxCost: number): IPathTree {
    const queue = new TinyQueue(this.nextQueue, (a, b) => a.cost - b.cost);
    this.nextQueue = [];

    while (queue.length) {
      const { cost, position } = queue.pop();

      if (cost > this.costs[position]) {
        // we have already found a better way
        continue;
      }

      if (cost > maxCost) {
        // remember this state for subsequent calls
        this.nextQueue.push({ cost, position });
      } else {
        for (const edge of this.adjacencyList[position]) {
          const next = { cost: cost + edge.cost, position: edge.node };

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
        const label = this.labels[position];
        result[label] = cost;
      }
    }

    return result;
  }

  private getNodeIndex(label: string) {
    if (!this.nodes[label]) {
      const index = this.adjacencyList.length;
      this.nodes[label] = index;
      this.labels.push(label);
      this.adjacencyList.push([]);

      if (this.costs) {
        // adding a node during tree construction
        this.costs.push(Infinity);
      }
    }

    return this.nodes[label];
  }
}
