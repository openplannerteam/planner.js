import PathfindingGraph from "../graph";
import { IShortestPathAlgorithm, IShortestPathInstance } from "../pathfinder";
export declare class BidirDijkstra implements IShortestPathAlgorithm {
    createInstance(graph: PathfindingGraph): IShortestPathInstance;
}
