import PathfindingGraph from "../graph";
import { IShortestPathTreeAlgorithm, IShortestPathTreeInstance } from "../pathfinder";
export default class DijkstraTree implements IShortestPathTreeAlgorithm {
    createInstance(graph: PathfindingGraph): IShortestPathTreeInstance;
}
