"use strict";
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
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
class TrafficEstimator {
    constructor(point, container = default_1.default) {
        this.baseTileProvider = container.getTagged(types_1.default.RoutableTileProvider, "phase", RoutingPhase_1.default.Base);
        this.transitTileProvider = container.getTagged(types_1.default.RoutableTileProvider, "phase", RoutingPhase_1.default.Transit);
        this.pathfinderProvider = container.get(types_1.default.PathfinderProvider);
        this.registry = RoutableTileRegistry_1.default.getInstance();
        this.profileProvider = container.get(types_1.default.ProfileProvider);
        this.eventBus = EventBus_1.default.getInstance();
        this.reachedTiles = new Set();
        this.startPoint = point;
        this.showIncremental = false;
        this.embedded = false;
        this.setProfileID("http://hdelva.be/profile/car");
    }
    enableIncrementalResults() {
        this.showIncremental = true;
    }
    async setDevelopmentProfile(blob) {
        const id = await this.profileProvider.parseDevelopmentProfile(blob);
        this.setProfileID(id);
    }
    async setProfileID(profileID) {
        this.activeProfile = this.profileProvider.getProfile(profileID);
        this.embedded = false;
    }
    startSimulation(nodes, timeM) {
        return __asyncGenerator(this, arguments, function* startSimulation_1() {
            const data = Array.from(nodes);
            const profile = yield __await(this.activeProfile);
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
                    const path = yield __await(pathfinder.queryPath(index1, index2, 90 * 1000 / 60 * timeM));
                    yield yield __await(path);
                }
            }
        });
    }
    getAreaTree(maxDuration, steps) {
        return __asyncGenerator(this, arguments, function* getAreaTree_1() {
            if (!this.embedded) {
                yield __await(this.embedBeginPoint(this.startPoint));
                this.embedded = true;
            }
            yield __await(this.loaded);
            const profile = yield __await(this.activeProfile);
            console.log(`Using the ${profile.getID()} profile`);
            const pathfinder = this.pathfinderProvider.getShortestPathTreeAlgorithm(profile);
            let pathTree = yield __await(pathfinder.start(Geo_1.default.getId(this.startPoint), maxDuration / steps));
            yield yield __await(this.pruneTree(pathTree));
            for (let i = 1; i <= steps; i++) {
                console.log(maxDuration / steps * i);
                pathTree = yield __await(pathfinder.continue(maxDuration / steps * i));
                yield yield __await(this.pruneTree(pathTree));
            }
        });
    }
    pruneTree(tree) {
        const result = {};
        for (const [id, branch] of Object.entries(tree)) {
            if (branch.previousNode) {
                result[id] = branch;
            }
        }
        return result;
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
            this.fetchTile(coordinate, true);
            return coordinate;
        });
        // this won't download anything new
        // but we need the tile data to embed the starting location
        const fromTileset = await this.baseTileProvider.getMultipleByTileCoords(fromTileCoords);
        await this.pathfinderProvider.embedLocation(from, fromTileset);
    }
    async fetchTile(coordinate, base) {
        let tileId;
        if (base) {
            tileId = this.baseTileProvider.getIdForTileCoords(coordinate);
        }
        else {
            tileId = this.transitTileProvider.getIdForTileCoords(coordinate);
        }
        if (!this.reachedTiles.has(tileId)) {
            this.eventBus.emit(EventType_1.default.ReachableTile, coordinate);
            const profile = await this.activeProfile;
            const pathfinder = this.pathfinderProvider.getShortestPathTreeAlgorithm(profile);
            let tile;
            if (base) {
                tile = await this.baseTileProvider.getByTileCoords(coordinate);
            }
            else {
                tile = await this.transitTileProvider.getByTileCoords(coordinate);
            }
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
                    await self.fetchTile(boundaryTileCoordinate, false);
                });
            }
        }
    }
}
exports.default = TrafficEstimator;
//# sourceMappingURL=main.js.map