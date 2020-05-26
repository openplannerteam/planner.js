import { AsyncIterator } from "asynciterator";
import { EventEmitter } from "events";
import "isomorphic-fetch";
import "reflect-metadata";
import inBBox from "tiles-in-bbox";
import defaultContainer from "../../configs/default";
import Profile from "../../entities/profile/Profile";
import { RoutableTile } from "../../entities/tiles/RoutableTile";
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

export default class TrafficEstimator {
    private pathfinderProvider: PathfinderProvider;
    private baseTileProvider: IRoutableTileProvider;
    private transitTileProvider: IRoutableTileProvider;
    private reachedTiles: Set<string>;
    private startPoint: ILocation;
    private registry: RoutableTileRegistry;
    private profileProvider: ProfileProvider;
    private eventBus: EventEmitter;

    private activeProfile: Promise<Profile>;
    private loaded: Promise<boolean>;
    private embedded: boolean;
    private showIncremental: boolean;

    constructor(point: ILocation, container = defaultContainer) {
        this.baseTileProvider = container.getTagged<IRoutableTileProvider>(
            TYPES.RoutableTileProvider,
            "phase",
            RoutingPhase.Base,
        );
        this.transitTileProvider = container.getTagged<IRoutableTileProvider>(
            TYPES.RoutableTileProvider,
            "phase",
            RoutingPhase.Transit,
        );
        this.pathfinderProvider = container.get<PathfinderProvider>(TYPES.PathfinderProvider);
        this.registry = RoutableTileRegistry.getInstance();
        this.profileProvider = container.get<ProfileProvider>(TYPES.ProfileProvider);
        this.eventBus = EventBus.getInstance();
        this.reachedTiles = new Set();
        this.startPoint = point;
        this.showIncremental = false;
        this.embedded = false;

        this.setProfileID("http://hdelva.be/profile/car");
    }

    public enableIncrementalResults() {
        this.showIncremental = true;
    }

    public async setDevelopmentProfile(blob: object) {
        const id = await this.profileProvider.parseDevelopmentProfile(blob);
        this.setProfileID(id);
    }

    public async setProfileID(profileID: string) {
        this.activeProfile = this.profileProvider.getProfile(profileID);
        this.embedded = false;
    }

    public async * startSimulation(nodes: Set<string>, timeM: number) {
        const data = Array.from(nodes);

        const profile = await this.activeProfile;
        console.log(`Using the ${profile.getID()} profile`);

        const pathfinder = this.pathfinderProvider.getShortestPathAlgorithm(profile);

        while (true) {
            const index1 = data[Math.floor(Math.random() * data.length)];

            /*
            const pathfinder = this.pathfinderProvider.getShortestPathTreeAlgorithm(profile);

            const pathTree: IPathTree = await pathfinder.start(index1, timeM * 60 * 1000);
            yield this.pruneTree(pathTree);
            */

            const index2 = data[Math.floor(Math.random() * data.length)];

            if (index1 !== index2) {
                const path = await pathfinder.queryPath(index1, index2, 90 * 1000 / 60 * timeM);
                yield path;
            }

        }
    }

    public async * getAreaTree(maxDuration: number, steps: number) {
        if (!this.embedded) {
            await this.embedBeginPoint(this.startPoint);
            this.embedded = true;
        }

        await this.loaded;
        const profile = await this.activeProfile;

        console.log(`Using the ${profile.getID()} profile`);
        const pathfinder = this.pathfinderProvider.getShortestPathTreeAlgorithm(profile);

        let pathTree: IPathTree = await pathfinder.start(Geo.getId(this.startPoint), maxDuration / steps);
        yield this.pruneTree(pathTree);

        for (let i = 1; i <= steps; i++) {
            console.log(maxDuration / steps * i);
            pathTree = await pathfinder.continue(maxDuration / steps * i);
            yield this.pruneTree(pathTree);
        }
    }

    private pruneTree(tree: IPathTree): IPathTree {
        const result = {};
        for (const [id, branch] of Object.entries(tree)) {
            if (branch.previousNode) {
                result[id] = branch;
            }
        }
        return result;
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
            this.fetchTile(coordinate, true);
            return coordinate;
        });

        // this won't download anything new
        // but we need the tile data to embed the starting location
        const fromTileset = await this.baseTileProvider.getMultipleByTileCoords(fromTileCoords);
        await this.pathfinderProvider.embedLocation(from, fromTileset);
    }

    private async fetchTile(coordinate: TileCoordinate, base) {
        let tileId: string;
        if (base) {
            tileId = this.baseTileProvider.getIdForTileCoords(coordinate);
        } else {
            tileId = this.transitTileProvider.getIdForTileCoords(coordinate);
        }
        if (!this.reachedTiles.has(tileId)) {
            this.eventBus.emit(EventType.ReachableTile, coordinate);

            const profile = await this.activeProfile;
            const pathfinder = this.pathfinderProvider.getShortestPathTreeAlgorithm(profile);
            let tile: RoutableTile;
            if (base) {
                tile = await this.baseTileProvider.getByTileCoords(coordinate);
            } else {
                tile = await this.transitTileProvider.getByTileCoords(coordinate);
            }
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
                    await self.fetchTile(boundaryTileCoordinate, false);
                });
            }
        }
    }
}
