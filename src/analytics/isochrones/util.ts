import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";
import ILocation from "../../interfaces/ILocation";
import Geo from "../../util/Geo";

export function lat_to_tile(lat: number, zoom: number) {
    // from https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
    return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI)
        / 2 * Math.pow(2, zoom));
}

export function long_to_tile(lon: number, zoom: number) {
    // from https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
    return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
}

export function toTileCoordinate(lat: number, long: number, zoom = 14): RoutableTileCoordinate {
    return {
        x: long_to_tile(long, zoom),
        y: lat_to_tile(lat, zoom),
        zoom,
    };
}

export function edgesOfTriangle(t) {
    // from https://mapbox.github.io/delaunator
    return [3 * t, 3 * t + 1, 3 * t + 2];
}

export function pointsOfTriangle(delaunay, t) {
    // from https://mapbox.github.io/delaunator
    return edgesOfTriangle(t)
        .map((e) => delaunay.triangles[e]);
}

export function getNeighborTiles(coordinate: RoutableTileCoordinate): RoutableTileCoordinate[] {
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
