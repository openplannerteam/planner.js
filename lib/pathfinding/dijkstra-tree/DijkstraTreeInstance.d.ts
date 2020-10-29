import PathfindingGraph from "../graph";
import { IPathTree, IShortestPathTreeInstance } from "../pathfinder";
export default class DijkstraTreeInstance implements IShortestPathTreeInstance {
    private nextQueue;
    private costs;
    private previousNodes;
    private graph;
    private useWeightedCost;
    constructor(graph: PathfindingGraph);
    setUseWeightedCost(useWeightedCost: boolean): void;
    setBreakPoint(on: string, callback: (on: string) => Promise<void>): void;
    removeBreakPoint(on: string): void;
    start(from: string, maxCost: number): Promise<IPathTree>;
    continue(maxCost: number): Promise<IPathTree>;
    private getCost;
}
