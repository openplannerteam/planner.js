import { DistanceM, DurationMs } from "../interfaces/units";
import ILocationResolver from "../query-runner/ILocationResolver";
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
    createInstance(graph: PathfindingGraph, locationResolver: ILocationResolver): IPathfinderInstance;
}

interface IPathfinderInstance {
    setUseWeightedCost(useWeightedCost: boolean): void;
    setBreakPoint(on: string, callback: (on: string) => Promise<void>): void;
    removeBreakPoint(on: string): void;
}

export interface IShortestPathInstance extends IPathfinderInstance {
    queryPath(from: string, to: string, maxDistance: number);
}

export interface IShortestPathTreeInstance extends IPathfinderInstance {
    start(from: string, maxCost: number): Promise<IPathTree>;
    continue(maxCost: number): Promise<IPathTree>;
}

export interface IShortestPathAlgorithm extends IPathfinder {
    createInstance(graph: PathfindingGraph, locationResolver: ILocationResolver): IShortestPathInstance;
}

export interface IShortestPathTreeAlgorithm extends IPathfinder {
    createInstance(graph: PathfindingGraph): IShortestPathTreeInstance;
}
