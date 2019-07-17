import concaveman = require("concaveman");
// @ts-ignore
import { EventEmitter, Listener } from "events";
import "isomorphic-fetch";
import "reflect-metadata";
import inBBox from "tiles-in-bbox";
import Context from "../../Context";
import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";
import RoutableTileRegistry from "../../entities/tiles/registry";
import ProfileProvider from "../../fetcher/profiles/ProfileProviderDefault";
import IRoutableTileProvider from "../../fetcher/tiles/IRoutableTileProvider";
import ILocation from "../../interfaces/ILocation";
import defaultContainer from "../../inversify.config";
import { IPathTree } from "../../pathfinding/pathfinder";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import ILocationResolver from "../../query-runner/ILocationResolver";
import TYPES from "../../types";
import Geo from "../../util/Geo";
import { toTileCoordinate } from "./util";
import { visualizeConcaveIsochrone, visualizeIsochrone } from "./visualize";

// @ts-ignore
export default class IsochroneGenerator implements EventEmitter {
    private context: Context;

    private pathfinderProvider: PathfinderProvider;
    private tileProvider: IRoutableTileProvider;
    private reachedTiles: Set<string>;
    private startPoint: ILocation;
    private registry: RoutableTileRegistry;
    private profileProvider: ProfileProvider;
    private locationResolver: ILocationResolver;

    private loaded: Promise<boolean>;
    private showIncremental: boolean;
    private showDebugLogs: boolean;
    private reachedPoints: ILocation[];

    constructor(point: ILocation, container = defaultContainer) {
        this.context = container.get<Context>(TYPES.Context);
        this.context.setContainer(container);
        this.tileProvider = container.get<IRoutableTileProvider>(TYPES.RoutableTileProvider);
        this.pathfinderProvider = container.get<PathfinderProvider>(TYPES.PathfinderProvider);
        this.registry = container.get<RoutableTileRegistry>(TYPES.RoutableTileRegistry);
        this.profileProvider = container.get<ProfileProvider>(TYPES.ProfileProvider);
        this.locationResolver = container.get<ILocationResolver>(TYPES.LocationResolver);
        this.reachedTiles = new Set();
        this.startPoint = point;
        this.reachedPoints = [this.startPoint];
        this.showIncremental = false;
        this.showDebugLogs = false;

        this.setProfileID("http://hdelva.be/profile/car");
    }

    public enableIncrementalResults() {
        this.showIncremental = true;
    }

    public enableDebugLogs() {
        this.showDebugLogs = true;
    }

    public addListener(type: string | symbol, listener: Listener): this {
        this.context.addListener(type, listener);

        return this;
    }

    public emit(type: string | symbol, ...args: any[]): boolean {
        return this.context.emit(type, ...args);
    }

    public listenerCount(type: string | symbol): number {
        return this.context.listenerCount(type);
    }

    public listeners(type: string | symbol): Listener[] {
        return this.context.listeners(type);
    }

    public on(type: string | symbol, listener: Listener): this {
        this.context.on(type, listener);

        return this;
    }

    public once(type: string | symbol, listener: Listener): this {
        this.context.once(type, listener);

        return this;
    }

    public removeAllListeners(type?: string | symbol): this {
        this.context.removeAllListeners(type);

        return this;
    }

    public removeListener(type: string | symbol, listener: Listener): this {
        this.context.removeListener(type, listener);

        return this;
    }

    public setMaxListeners(n: number): this {
        this.context.setMaxListeners(n);

        return this;
    }

    public async setDevelopmentProfile(blob: object) {
        const id = await this.profileProvider.setDevelopmentProfile(blob);
        this.loaded = this.profileProvider.setActiveProfileID(id).then(() => {
            return this.embedBeginPoint(this.startPoint);
        }).then(() => {
            return true;
        });
    }

    public async setProfileID(profileID: string) {
        this.loaded = this.profileProvider.setActiveProfileID(profileID).then(() => {
            return this.embedBeginPoint(this.startPoint);
        }).then(() => {
            return true;
        });
    }

    public async getIsochrone(maxDuration: number, reset = true) {
        console.time("execution time");
        if (this.showDebugLogs) {
            console.log(`Generating the ${maxDuration / 1000}s isochrone ` +
            `from ${this.startPoint.latitude}, ${this.startPoint.longitude}`);
        }

        await this.loaded;

        if (this.showDebugLogs) {
            const profile = await this.profileProvider.getActiveProfile();
            console.log(`Using the ${profile.getID()} profile`);
        }

        const pathfinder = await this.pathfinderProvider.getShortestPathTreeAlgorithm();

        // wait for all data to arrive
        await this.tileProvider.wait();

        let pathTree: IPathTree;
        pathfinder.setUseWeightedCost(false); // we want the raw durations
        if (reset) {
            pathTree = await pathfinder.start(Geo.getId(this.startPoint), maxDuration);
        } else {
            pathTree = await pathfinder.continue(maxDuration);
        }

        if (this.showDebugLogs) {
            console.log(`Path tree computed using ${this.reachedTiles.size} tiles.`);
            console.timeEnd("execution time");
        }

        return await visualizeConcaveIsochrone(this.locationResolver, pathTree, maxDuration);
    }

    private async fetchTile(coordinate: RoutableTileCoordinate) {
        const tileId = this.tileProvider.getIdForTileCoords(coordinate);
        if (!this.reachedTiles.has(tileId)) {
            this.emit("TILE", coordinate);
            this.reachedTiles.add(tileId);

            const pathfinder = await this.pathfinderProvider.getShortestPathTreeAlgorithm();
            const tile = await this.tileProvider.getByTileCoords(coordinate);
            const boundaryNodes: Set<string> = new Set();

            for (const nodeId of tile.getNodes()) {
                pathfinder.removeBreakPoint(nodeId);
                const node = this.registry.getNode(nodeId);
                if (!tile.contains(node)) {
                    boundaryNodes.add(nodeId);
                }

                if (this.showIncremental) {
                    if (Math.random() * this.reachedPoints.length < 100) {
                        pathfinder.setBreakPoint(nodeId, async (on: string) => {
                            const innerNode = self.registry.getNode(on);
                            if (innerNode) {
                                this.reachedPoints.push(innerNode);
                                const internalNodes = this.reachedPoints
                                    .map((n) => [n.longitude, n.latitude]);

                                self.emit("INTERMEDIATE", concaveman(internalNodes, Infinity).map((e) => [e[1], e[0]]));
                            }
                        });
                    }
                }
            }

            const self = this;
            for (const nodeId of boundaryNodes) {
                pathfinder.setBreakPoint(nodeId, async (on: string) => {
                    const node = self.registry.getNode(on);
                    const boundaryTileCoordinate = toTileCoordinate(node.latitude, node.longitude);
                    await self.fetchTile(boundaryTileCoordinate);
                });
            }
        }
    }

    private async embedBeginPoint(from: ILocation) {
        const zoom = 14;
        const padding = 0.005;

        const fromBBox = {
            top: from.latitude + padding,
            bottom: from.latitude - padding,
            left: from.longitude - padding,
            right: from.longitude + padding,
        };

        const fromTileCoords = inBBox.tilesInBbox(fromBBox, zoom).map((obj) => {
            const coordinate = new RoutableTileCoordinate(zoom, obj.x, obj.y);
            this.fetchTile(coordinate);
            return coordinate;
        });

        // this won't download anything new
        // but we need the tile data to embed the starting location
        const fromTileset = await this.tileProvider.getMultipleByTileCoords(fromTileCoords);
        await this.pathfinderProvider.embedLocation(from, fromTileset);
    }
}
