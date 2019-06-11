import { DistanceM, DurationMs } from "../interfaces/units";
import PathfindingGraph from "./graph";

export interface IPathTree {
    [node: string]: DurationMs;
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
    queryPathSummary(from: string, to: string): IPathSummary;
}

export interface IShortestPathTreeAlgorithm extends IPathfinder {
    start(from: string, maxCost: number): Promise<IPathTree>;
    continue(maxCost: number): Promise<IPathTree>;
}
