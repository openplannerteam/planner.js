import { DistanceM, DurationMs } from "../interfaces/units";
import PathfindingGraph from "./graph";

export interface IPathTree {
    [node: string]: IPathTreeBranch;
}

export interface IPathTreeBranch {
    duration: DurationMs;
    previousNode: string;
}

export interface IPathSummary {
    distance: DistanceM;
    duration: DurationMs;
    cost: number;
}

interface IPathfinder {
    setGraph(graph: PathfindingGraph): void;
    setUseWeightedCost(useWeightedCost: boolean): void;

    setBreakPoint(on: string, callback: (on: string) => Promise<void>): void;
    removeBreakPoint(on: string): void;
}

export interface IShortestPathAlgorithm extends IPathfinder {
    queryPath(from: string, to: string);
    queryPathSummary(from: string, to: string): Promise<IPathSummary>;
}

export interface IShortestPathTreeAlgorithm extends IPathfinder {
    start(from: string, maxCost: number): Promise<IPathTree>;
    continue(maxCost: number): Promise<IPathTree>;
}
