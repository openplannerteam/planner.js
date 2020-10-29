import PathfindingGraph from "../graph";
import { IShortestPathInstance } from "../pathfinder";
export declare class BidirDijkstraInstance implements IShortestPathInstance {
    private graph;
    private useWeightedCost;
    private forwardCosts;
    private backwardCosts;
    private forwardParents;
    private backwardParents;
    constructor(graph: PathfindingGraph);
    setUseWeightedCost(useWeightedCost: boolean): void;
    setBreakPoint(on: string, callback: (on: string) => Promise<void>): void;
    removeBreakPoint(on: string): void;
    queryPath(from: string, to: string, maxDistance?: number): Promise<any[]>;
    private constructPath;
    private forwardStep;
    private backwardStep;
    private setForwardCost;
    private getForwardCost;
    private setBackwardCost;
    private getBackwardCost;
}
