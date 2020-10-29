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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const RoutableTileRegistry_1 = __importDefault(require("../../entities/tiles/RoutableTileRegistry"));
const RoutableTileSet_1 = require("../../entities/tiles/RoutableTileSet");
const TileCoordinate_1 = __importDefault(require("../../entities/tiles/TileCoordinate"));
const PathfinderProvider_1 = __importDefault(require("../../pathfinding/PathfinderProvider"));
const types_1 = __importDefault(require("../../types"));
const Tiles_1 = require("../../util/Tiles");
let RoutableTileProviderDefault = class RoutableTileProviderDefault {
    constructor(pathfinderProvider, fetcher) {
        this.tiles = {};
        this.pathfinderProvider = pathfinderProvider;
        this.fetcher = fetcher;
        this.registry = RoutableTileRegistry_1.default.getInstance();
    }
    async wait() {
        await Promise.all(Object.values(this.tiles));
    }
    getIdForLocation(zoom, location) {
        const y = Tiles_1.lat_to_tile(location.latitude, zoom);
        const x = Tiles_1.long_to_tile(location.longitude, zoom);
        const coordinate = new TileCoordinate_1.default(zoom, x, y);
        return this.getIdForTileCoords(coordinate);
    }
    getIdForTileCoords(coordinate) {
        return `https://tiles.openplanner.team/planet/${coordinate.zoom}/${coordinate.x}/${coordinate.y}`;
    }
    getByLocation(zoom, location) {
        const y = this.lat2tile(location.latitude, zoom);
        const x = this.long2tile(location.longitude, zoom);
        const coordinate = new TileCoordinate_1.default(zoom, x, y);
        return this.getByTileCoords(coordinate);
    }
    async getByTileCoords(coordinate) {
        const url = this.getIdForTileCoords(coordinate);
        const tile = await this.getByUrl(url);
        tile.coordinate = coordinate; // todo, get these from server response
        return tile;
    }
    async getmultipleByLocation(zoom, locations) {
        const tiles = await Promise.all(locations.map((location) => {
            return this.getByLocation(zoom, location);
        }));
        return new RoutableTileSet_1.RoutableTileSet(tiles);
    }
    async getMultipleByTileCoords(coordinates) {
        const tiles = await Promise.all(coordinates.map((coordinate) => {
            return this.getByTileCoords(coordinate);
        }));
        return new RoutableTileSet_1.RoutableTileSet(tiles);
    }
    async getByUrl(url) {
        if (!this.tiles[url]) {
            this.tiles[url] = this.fetcher.get(url);
            const tile = await this.tiles[url];
            this.pathfinderProvider.registerEdges(tile.getWays());
        }
        return await this.tiles[url];
    }
    long2tile(lon, zoom) {
        return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
    }
    lat2tile(lat, zoom) {
        return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1
            / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
    }
};
RoutableTileProviderDefault = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.PathfinderProvider)),
    __param(1, inversify_1.inject(types_1.default.RoutableTileFetcher)),
    __metadata("design:paramtypes", [PathfinderProvider_1.default, Object])
], RoutableTileProviderDefault);
exports.default = RoutableTileProviderDefault;
//# sourceMappingURL=RoutableTileProviderDefault.js.map