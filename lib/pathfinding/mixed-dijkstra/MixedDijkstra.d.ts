import ILocationResolver from "../../query-runner/ILocationResolver";
import PathfindingGraph from "../graph";
import { IShortestPathAlgorithm, IShortestPathInstance } from "../pathfinder";
export default class MixedDijkstra implements IShortestPathAlgorithm {
    createInstance(graph: PathfindingGraph, locationResolver: ILocationResolver): IShortestPathInstance;
}
