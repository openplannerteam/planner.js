import "isomorphic-fetch";
import "reflect-metadata";
import ILocation from "../../interfaces/ILocation";
export default class IsochroneGenerator {
    private pathfinderProvider;
    private tileProvider;
    private reachedTiles;
    private startPoint;
    private registry;
    private profileProvider;
    private eventBus;
    private activeProfile;
    private loaded;
    private embedded;
    private showIncremental;
    private showDebugLogs;
    constructor(point: ILocation, container?: import("inversify/dts/container/container").Container);
    enableIncrementalResults(): void;
    enableDebugLogs(): void;
    setDevelopmentProfile(blob: object): Promise<void>;
    setProfileID(profileID: string): Promise<void>;
    getIsochrone(maxDuration: number, reset?: boolean): Promise<{
        isochrones: any[];
    }>;
    private fetchTile;
    private embedBeginPoint;
}
