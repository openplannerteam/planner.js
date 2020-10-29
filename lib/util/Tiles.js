"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const TileCoordinate_1 = __importDefault(require("../entities/tiles/TileCoordinate"));
function lat_to_tile(lat, zoom) {
    // from https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
    return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI)
        / 2 * Math.pow(2, zoom));
}
exports.lat_to_tile = lat_to_tile;
function long_to_tile(lon, zoom) {
    // from https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
    return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
}
exports.long_to_tile = long_to_tile;
function toTileCoordinate(lat, long, zoom = 14) {
    return new TileCoordinate_1.default(zoom, long_to_tile(long, zoom), lat_to_tile(lat, zoom));
}
exports.toTileCoordinate = toTileCoordinate;
//# sourceMappingURL=Tiles.js.map