import { injectable } from "inversify";
import TinyQueue from "tinyqueue";
import { DistanceM, DurationMs } from "../../interfaces/units";
import PathfindingGraph from "../graph";
import { IPathTree, IShortestPathTreeAlgorithm, IShortestPathTreeInstance } from "../pathfinder";
import DijkstraTreeInstance from "./dijkstra-tree-js-instance";

interface IState {
  position: number;
  distance: DistanceM;
  duration: DurationMs;
  cost: number;
}

@injectable()
export default class DijkstraTree implements IShortestPathTreeAlgorithm {
  public createInstance(graph: PathfindingGraph): IShortestPathTreeInstance {
    return new DijkstraTreeInstance(graph);
  }
}
