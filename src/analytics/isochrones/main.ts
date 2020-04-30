import { EventEmitter } from "events";
import "isomorphic-fetch";
import "reflect-metadata";
import inBBox from "tiles-in-bbox";
import defaultContainer from "../../configs/default";
import Profile from "../../entities/profile/Profile";
import RoutableTileRegistry from "../../entities/tiles/RoutableTileRegistry";
import TileCoordinate from "../../entities/tiles/TileCoordinate";
import RoutingPhase from "../../enums/RoutingPhase";
import EventBus from "../../events/EventBus";
import EventType from "../../events/EventType";
import ProfileProvider from "../../fetcher/profiles/ProfileProviderDefault";
import IRoutableTileProvider from "../../fetcher/tiles/IRoutableTileProvider";
import ILocation from "../../interfaces/ILocation";
import { IPathTree } from "../../pathfinding/pathfinder";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import TYPES from "../../types";
import Geo from "../../util/Geo";
import { toTileCoordinate } from "../../util/Tiles";
import { visualizeConcaveIsochrone, visualizeIsochrone } from "./visualize";

export default class IsochroneGenerator {
    private pathfinderProvider: PathfinderProvider;
    private tileProvider: IRoutableTileProvider;
    private reachedTiles: Set<string>;
    private startPoint: ILocation;
    private registry: RoutableTileRegistry;
    private profileProvider: ProfileProvider;
    private eventBus: EventEmitter;

    private activeProfile: Promise<Profile>;
    private loaded: Promise<boolean>;
    private embedded: boolean;
    private showIncremental: boolean;
    private showDebugLogs: boolean;

    constructor(point: ILocation, container = defaultContainer) {
        this.tileProvider = container.getTagged<IRoutableTileProvider>(
            TYPES.RoutableTileProvider,
            "phase",
            RoutingPhase.Base,
        );
        this.pathfinderProvider = container.get<PathfinderProvider>(TYPES.PathfinderProvider);
        this.registry = RoutableTileRegistry.getInstance();
        this.profileProvider = container.get<ProfileProvider>(TYPES.ProfileProvider);
        this.eventBus = EventBus.getInstance();
        this.reachedTiles = new Set();
        this.startPoint = point;
        this.showIncremental = false;
        this.showDebugLogs = false;
        this.embedded = false;

        this.setProfileID("http://hdelva.be/profile/car");
    }

    public enableIncrementalResults() {
        this.showIncremental = true;
    }

    public enableDebugLogs() {
        this.showDebugLogs = true;
    }

    public async setDevelopmentProfile(blob: object) {
        const id = await this.profileProvider.parseDevelopmentProfile(blob);
        this.setProfileID(id);
    }

    public async setProfileID(profileID: string) {
        this.activeProfile = this.profileProvider.getProfile(profileID);
        this.embedded = false;
    }

    public async getIsochrone(maxDuration: number, reset = true) {
        if (this.showDebugLogs) {
            console.time(Geo.getId(this.startPoint));
            console.log(`Generating the ${maxDuration / 1000}s isochrone ` +
                `from ${this.startPoint.latitude}, ${this.startPoint.longitude}`);
        }

        if (!this.embedded) {
            await this.embedBeginPoint(this.startPoint);
            this.embedded = true;
        }

        await this.loaded;
        const profile = await this.activeProfile;

        if (this.showDebugLogs) {
            console.log(`Using the ${profile.getID()} profile`);
        }

        const pathfinder = this.pathfinderProvider.getShortestPathTreeAlgorithm(profile);

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
            console.timeEnd(Geo.getId(this.startPoint));
            console.time(Geo.getId(this.startPoint));
        }

        const result = await visualizeConcaveIsochrone(pathTree, maxDuration, this.registry);

        if (this.showDebugLogs) {
            console.timeEnd(Geo.getId(this.startPoint));
        }

        return result;
    }

    private async fetchTile(coordinate: TileCoordinate) {
        const tileId = this.tileProvider.getIdForTileCoords(coordinate);
        if (!this.reachedTiles.has(tileId)) {
            this.eventBus.emit(EventType.ReachableTile, coordinate);

            const profile = await this.activeProfile;
            const pathfinder = this.pathfinderProvider.getShortestPathTreeAlgorithm(profile);
            const tile = await this.tileProvider.getByTileCoords(coordinate);
            this.reachedTiles.add(tileId);
            const boundaryNodes: Set<string> = new Set();

            for (const nodeId of tile.getNodes()) {
                pathfinder.removeBreakPoint(nodeId);
                const node = this.registry.getNode(nodeId);
                if (!tile.contains(node)) {
                    boundaryNodes.add(nodeId);
                }

                if (this.showIncremental) {
                    pathfinder.setBreakPoint(nodeId, async (on: string) => {
                        const innerNode = self.registry.getNode(on);
                        if (innerNode) {
                            self.eventBus.emit(EventType.ReachableLocation, innerNode);
                        }
                    });
                }
            }

            const self = this;
            for (const nodeId of boundaryNodes) {
                const node = self.registry.getNode(nodeId);
                const boundaryTileCoordinate = toTileCoordinate(node.latitude, node.longitude);

                pathfinder.setBreakPoint(nodeId, async (on: string) => {
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
            const coordinate = new TileCoordinate(zoom, obj.x, obj.y);
            this.fetchTile(coordinate);
            return coordinate;
        });

        // this won't download anything new
        // but we need the tile data to embed the starting location
        const fromTileset = await this.tileProvider.getMultipleByTileCoords(fromTileCoords);
        await this.pathfinderProvider.embedLocation(from, fromTileset);
    }
}
