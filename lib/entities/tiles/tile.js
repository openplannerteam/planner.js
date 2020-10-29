"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const coordinate_1 = require("./coordinate");
function tile_to_lat(coordinate) {
    // from https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
    const n = Math.PI - 2 * Math.PI * coordinate.y / Math.pow(2, coordinate.zoom);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}
function tile_to_long(coordinate) {
    // from https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
    return (coordinate.x / Math.pow(2, coordinate.zoom) * 360 - 180);
}
class RoutableTile {
    constructor(id, nodes, ways) {
        this.id = id;
        this.nodes = nodes;
        this.ways = ways;
    }
    getWays() {
        return this.ways;
    }
    getNodes() {
        return this.nodes;
    }
    contains(location) {
        const top = tile_to_lat(this.coordinate);
        const left = tile_to_long(this.coordinate);
        const next = new coordinate_1.RoutableTileCoordinate(this.coordinate.zoom, this.coordinate.x + 1, this.coordinate.y + 1);
        const bottom = tile_to_lat(next);
        const right = tile_to_long(next);
        if (location.latitude > top || location.latitude < bottom) {
            return false;
        }
        else if (location.longitude < left || location.longitude > right) {
            return false;
        }
        return true;
    }
}
exports.RoutableTile = RoutableTile;
//# sourceMappingURL=tile.js.map