import PathfindingGraph from "../graph";
import { IShortestPathAlgorithm, IShortestPathInstance } from "../pathfinder";
export declare class Dijkstra implements IShortestPathAlgorithm {
    createInstance(graph: PathfindingGraph): IShortestPathInstance;
}
