import { injectable } from "inversify";
import PathfindingGraph from "../graph";
import { IShortestPathAlgorithm, IShortestPathInstance } from "../pathfinder";
import { BidirDijkstraInstance } from "./BidirDijkstraInstance";

@injectable()
export class BidirDijkstra implements IShortestPathAlgorithm {
    public createInstance(graph: PathfindingGraph): IShortestPathInstance {
        return new BidirDijkstraInstance(graph);
    }
}
