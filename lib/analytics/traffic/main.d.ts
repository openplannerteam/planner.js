import "isomorphic-fetch";
import "reflect-metadata";
import ILocation from "../../interfaces/ILocation";
import { IPathTree } from "../../pathfinding/pathfinder";
export default class TrafficEstimator {
    private pathfinderProvider;
    private baseTileProvider;
    private transitTileProvider;
    private reachedTiles;
    private startPoint;
    private registry;
    private profileProvider;
    private eventBus;
    private activeProfile;
    private loaded;
    private embedded;
    private showIncremental;
    constructor(point: ILocation, container?: import("inversify/dts/container/container").Container);
    enableIncrementalResults(): void;
    setDevelopmentProfile(blob: object): Promise<void>;
    setProfileID(profileID: string): Promise<void>;
    startSimulation(nodes: Set<string>, timeM: number): AsyncGenerator<any, void, unknown>;
    getAreaTree(maxDuration: number, steps: number): AsyncGenerator<IPathTree, void, unknown>;
    private pruneTree;
    private embedBeginPoint;
    private fetchTile;
}
