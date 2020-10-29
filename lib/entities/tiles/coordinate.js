"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RoutableTileCoordinate {
    constructor(zoom, x, y) {
        this.zoom = zoom;
        this.x = x;
        this.y = y;
    }
    contains(other) {
        const n = Math.pow(2, other.zoom - this.zoom);
        const otherX = Math.floor(other.x / n);
        const otherY = Math.floor(other.y / n);
        if (otherX === this.x && otherY === this.y) {
            return true;
        }
        else {
            return false;
        }
    }
}
exports.RoutableTileCoordinate = RoutableTileCoordinate;
//# sourceMappingURL=coordinate.js.map