import ILocation from "../interfaces/ILocation";
import { DistanceM } from "../interfaces/units";

export interface IPathTree {
    [node: string]: DistanceM;
}

interface IPathfinder {
    addEdge(from: string, to: string, weight: number): void;
}

export interface IShortestPathAlgorithm extends IPathfinder {
    queryDistance(from: string, to: string): number;
}

export interface IShortestPathTreeAlgorithm extends IPathfinder {
    start(from: string, maxCost: number): IPathTree;
    continue(maxCost: number): IPathTree;
}
