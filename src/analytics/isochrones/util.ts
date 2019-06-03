import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";
import ILocation from "../../interfaces/ILocation";
import Geo from "../../util/Geo";

export function lat_to_tile(lat: number, zoom: number) {
    // from https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
    return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI)
        / 2 * Math.pow(2, zoom));
}

export function tile_to_lat(coordinate: RoutableTileCoordinate) {
    // from https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
    const n = Math.PI - 2 * Math.PI * coordinate.y / Math.pow(2, coordinate.zoom);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}

export function tile_to_long(coordinate: RoutableTileCoordinate) {
    // from https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
    return (coordinate.x / Math.pow(2, coordinate.zoom) * 360 - 180);
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

export function getTileBoundingBox(coordinate: RoutableTileCoordinate): [ILocation, ILocation] {
    const top = tile_to_lat(coordinate);
    const left = tile_to_long(coordinate);

    const next = {
        zoom: coordinate.zoom,
        x: coordinate.x + 1,
        y: coordinate.y + 1,
    };

    const bottom = tile_to_lat(next);
    const right = tile_to_long(next);

    return [{ latitude: top, longitude: left }, { latitude: bottom, longitude: right }];
}

export function getDistanceBetweenTiles(first: RoutableTileCoordinate, second: RoutableTileCoordinate) {
    const firstBox = getTileBoundingBox(first);
    const secondBox = getTileBoundingBox(second);

    const firstPoint = {
        latitude: (firstBox[0].latitude + firstBox[1].latitude) / 2,
        longitude: (firstBox[0].longitude + firstBox[1].longitude) / 2,
    };

    const secondPoint = {
        latitude: (secondBox[0].latitude + secondBox[1].latitude) / 2,
        longitude: (secondBox[0].longitude + secondBox[1].longitude) / 2,
    };

    return Geo.getDistanceBetweenLocations(firstPoint, secondPoint);
}
