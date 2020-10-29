import ILocationResolver from "../../query-runner/ILocationResolver";
import PathfindingGraph from "../graph";
import { IShortestPathInstance } from "../pathfinder";
export declare class MixedDijkstraInstance implements IShortestPathInstance {
    private bidir;
    private classic;
    private locationResolver;
    constructor(graph: PathfindingGraph, locationResolver: ILocationResolver);
    setUseWeightedCost(useWeightedCost: boolean): void;
    setBreakPoint(on: string, callback: (on: string) => Promise<void>): void;
    removeBreakPoint(on: string): void;
    queryPath(from: string, to: string, maxDistance?: number): Promise<any[]>;
}
