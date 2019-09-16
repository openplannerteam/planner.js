import { injectable } from "inversify";
import PathfindingGraph from "../graph";
import { IShortestPathAlgorithm, IShortestPathInstance } from "../pathfinder";
import { DijkstraInstance } from "./DijkstraInstance";

@injectable()
export class Dijkstra implements IShortestPathAlgorithm {
    public createInstance(graph: PathfindingGraph): IShortestPathInstance {
        return new DijkstraInstance(graph);
    }
}
