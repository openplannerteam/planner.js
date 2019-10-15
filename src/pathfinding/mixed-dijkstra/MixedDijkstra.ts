import { injectable } from "inversify";
import ILocationResolver from "../../query-runner/ILocationResolver";
import PathfindingGraph from "../graph";
import { IShortestPathAlgorithm, IShortestPathInstance } from "../pathfinder";
import { MixedDijkstraInstance } from "./MixedDijkstraInstance";

@injectable()
export default class MixedDijkstra implements IShortestPathAlgorithm {
    public createInstance(graph: PathfindingGraph, locationResolver: ILocationResolver): IShortestPathInstance {
        return new MixedDijkstraInstance(graph, locationResolver);
    }
}
