"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const turf = __importStar(require("@turf/turf"));
const inversify_1 = require("inversify");
const rbush_1 = __importDefault(require("rbush"));
const PathfinderProvider_1 = __importDefault(require("../../pathfinding/PathfinderProvider"));
const types_1 = __importDefault(require("../../types"));
const RoutableTileProviderDefault_1 = __importDefault(require("./RoutableTileProviderDefault"));
const ZoiTileFetcherRaw_1 = __importDefault(require("./ZoiTileFetcherRaw"));
let CompositeTileProvider = class CompositeTileProvider extends RoutableTileProviderDefault_1.default {
    constructor(pathfinderProvider, fetcher) {
        super(pathfinderProvider, fetcher);
        this.tiles = {};
        this.zoiFetcher = new ZoiTileFetcherRaw_1.default();
    }
    async getByTileCoords(coordinate) {
        const url = this.getIdForTileCoords(coordinate);
        const zoiUrl = this.getZoiIdForTileCoords(coordinate);
        const tile = await this.getByUrl(url, zoiUrl);
        tile.coordinate = coordinate; // todo, get these from server response
        return tile;
    }
    getIdForTileCoords(coordinate) {
        // only for pedestrians right now
        return `https://hdelva.be/tiles/pedestrian/${coordinate.zoom}/${coordinate.x}/${coordinate.y}`;
    }
    async getByUrl(url, zoiUrl) {
        if (!this.tiles[url]) {
            this.tiles[url] = this.fetcher.get(url);
            const [routableTile, zoiTile] = await Promise.all([
                this.tiles[url], this.zoiFetcher.get(zoiUrl),
            ]);
            const tree = new rbush_1.default();
            tree.load(zoiTile.getZones().map((zone) => {
                const [minX, minY, maxX, maxY] = turf.bbox(zone.getBoundary().area);
                return {
                    minX, minY, maxX, maxY, zone,
                };
            }));
            for (const nodeId of routableTile.getNodes()) {
                const node = this.registry.getNode(nodeId);
                const q = tree.search({
                    minX: node.longitude, minY: node.latitude, maxX: node.longitude, maxY: node.latitude,
                });
                const sorted = q.sort((a, b) => b.zone.degree - a.zone.degree);
                for (const match of sorted) {
                    const zone = match.zone;
                    let update = false;
                    for (const tag of zone.getSubject().getValues()) {
                        if (!node.proximity[tag] || node.proximity[tag] < zone.getDegree()) {
                            update = true;
                            break;
                        }
                    }
                    if (update && zone.contains(node)) {
                        for (const tag of zone.getSubject().getValues()) {
                            if (!node.proximity[tag] || node.proximity[tag] < zone.getDegree()) {
                                node.proximity[tag] = zone.getDegree();
                            }
                        }
                    }
                }
            }
            this.pathfinderProvider.registerEdges(routableTile.getWays());
        }
        return await this.tiles[url];
    }
    getZoiIdForTileCoords(coordinate) {
        return `https://hdelva.be/zoi/${coordinate.zoom}/${coordinate.x}/${coordinate.y}`;
    }
};
CompositeTileProvider = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.PathfinderProvider)),
    __param(1, inversify_1.inject(types_1.default.RoutableTileFetcher)),
    __metadata("design:paramtypes", [PathfinderProvider_1.default, Object])
], CompositeTileProvider);
exports.default = CompositeTileProvider;
//# sourceMappingURL=CompositeTileProvider.js.map