"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function edgesOfTriangle(t) {
    // from https://mapbox.github.io/delaunator
    return [3 * t, 3 * t + 1, 3 * t + 2];
}
exports.edgesOfTriangle = edgesOfTriangle;
function pointsOfTriangle(delaunay, t) {
    // from https://mapbox.github.io/delaunator
    return edgesOfTriangle(t)
        .map((e) => delaunay.triangles[e]);
}
exports.pointsOfTriangle = pointsOfTriangle;
function getNeighborTiles(coordinate) {
    const result = [];
    for (const xDelta of [-1, 0, 1]) {
        for (const yDelta of [-1, 0, 1]) {
            if (xDelta || yDelta) {
                const neighbor = {
                    zoom: coordinate.zoom,
                    y: coordinate.y + yDelta,
                    x: coordinate.x + xDelta,
                };
                result.push(neighbor);
            }
        }
    }
    return result;
}
exports.getNeighborTiles = getNeighborTiles;
//# sourceMappingURL=util.js.map