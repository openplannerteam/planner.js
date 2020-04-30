import TileCoordinate from "../../entities/tiles/TileCoordinate";

export function edgesOfTriangle(t) {
    // from https://mapbox.github.io/delaunator
    return [3 * t, 3 * t + 1, 3 * t + 2];
}

export function pointsOfTriangle(delaunay, t) {
    // from https://mapbox.github.io/delaunator
    return edgesOfTriangle(t)
        .map((e) => delaunay.triangles[e]);
}

export function getNeighborTiles(coordinate: TileCoordinate): TileCoordinate[] {
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
