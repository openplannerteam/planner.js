"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("isomorphic-fetch");
require("reflect-metadata");
const tiles_in_bbox_1 = __importDefault(require("tiles-in-bbox"));
const default_1 = __importDefault(require("../../configs/default"));
const RoutableTileRegistry_1 = __importDefault(require("../../entities/tiles/RoutableTileRegistry"));
const TileCoordinate_1 = __importDefault(require("../../entities/tiles/TileCoordinate"));
const RoutingPhase_1 = __importDefault(require("../../enums/RoutingPhase"));
const EventBus_1 = __importDefault(require("../../events/EventBus"));
const EventType_1 = __importDefault(require("../../events/EventType"));
const types_1 = __importDefault(require("../../types"));
const Geo_1 = __importDefault(require("../../util/Geo"));
const Tiles_1 = require("../../util/Tiles");
const visualize_1 = require("./visualize");
class IsochroneGenerator {
    constructor(point, container = default_1.default) {
        this.tileProvider = container.getTagged(types_1.default.RoutableTileProvider, "phase", RoutingPhase_1.default.Base);
        this.pathfinderProvider = container.get(types_1.default.PathfinderProvider);
        this.registry = RoutableTileRegistry_1.default.getInstance();
        this.profileProvider = container.get(types_1.default.ProfileProvider);
        this.eventBus = EventBus_1.default.getInstance();
        this.reachedTiles = new Set();
        this.startPoint = point;
        this.showIncremental = false;
        this.showDebugLogs = false;
        this.embedded = false;
        this.setProfileID("http://hdelva.be/profile/car");
    }
    enableIncrementalResults() {
        this.showIncremental = true;
    }
    enableDebugLogs() {
        this.showDebugLogs = true;
    }
    async setDevelopmentProfile(blob) {
        const id = await this.profileProvider.parseDevelopmentProfile(blob);
        this.setProfileID(id);
    }
    async setProfileID(profileID) {
        this.activeProfile = this.profileProvider.getProfile(profileID);
        this.embedded = false;
    }
    async getIsochrone(maxDuration, reset = true) {
        if (this.showDebugLogs) {
            console.time(Geo_1.default.getId(this.startPoint));
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
        let pathTree;
        pathfinder.setUseWeightedCost(false); // we want the raw durations
        if (reset) {
            pathTree = await pathfinder.start(Geo_1.default.getId(this.startPoint), maxDuration);
        }
        else {
            pathTree = await pathfinder.continue(maxDuration);
        }
        if (this.showDebugLogs) {
            console.log(`Path tree computed using ${this.reachedTiles.size} tiles.`);
            console.timeEnd(Geo_1.default.getId(this.startPoint));
            console.time(Geo_1.default.getId(this.startPoint));
        }
        const result = await visualize_1.visualizeConcaveIsochrone(pathTree, maxDuration, this.registry);
        if (this.showDebugLogs) {
            console.timeEnd(Geo_1.default.getId(this.startPoint));
        }
        return result;
    }
    async fetchTile(coordinate) {
        const tileId = this.tileProvider.getIdForTileCoords(coordinate);
        if (!this.reachedTiles.has(tileId)) {
            this.eventBus.emit(EventType_1.default.ReachableTile, coordinate);
            const profile = await this.activeProfile;
            const pathfinder = this.pathfinderProvider.getShortestPathTreeAlgorithm(profile);
            const tile = await this.tileProvider.getByTileCoords(coordinate);
            this.reachedTiles.add(tileId);
            const boundaryNodes = new Set();
            for (const nodeId of tile.getNodes()) {
                pathfinder.removeBreakPoint(nodeId);
                const node = this.registry.getNode(nodeId);
                if (!tile.contains(node)) {
                    boundaryNodes.add(nodeId);
                }
                if (this.showIncremental) {
                    pathfinder.setBreakPoint(nodeId, async (on) => {
                        const innerNode = self.registry.getNode(on);
                        if (innerNode) {
                            self.eventBus.emit(EventType_1.default.ReachableLocation, innerNode);
                        }
                    });
                }
            }
            const self = this;
            for (const nodeId of boundaryNodes) {
                const node = self.registry.getNode(nodeId);
                const boundaryTileCoordinate = Tiles_1.toTileCoordinate(node.latitude, node.longitude);
                pathfinder.setBreakPoint(nodeId, async (on) => {
                    await self.fetchTile(boundaryTileCoordinate);
                });
            }
        }
    }
    async embedBeginPoint(from) {
        const zoom = 14;
        const padding = 0.005;
        const fromBBox = {
            top: from.latitude + padding,
            bottom: from.latitude - padding,
            left: from.longitude - padding,
            right: from.longitude + padding,
        };
        const fromTileCoords = tiles_in_bbox_1.default.tilesInBbox(fromBBox, zoom).map((obj) => {
            const coordinate = new TileCoordinate_1.default(zoom, obj.x, obj.y);
            this.fetchTile(coordinate);
            return coordinate;
        });
        // this won't download anything new
        // but we need the tile data to embed the starting location
        const fromTileset = await this.tileProvider.getMultipleByTileCoords(fromTileCoords);
        await this.pathfinderProvider.embedLocation(from, fromTileset);
    }
}
exports.default = IsochroneGenerator;
//# sourceMappingURL=main.js.map