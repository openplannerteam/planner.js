import TileCoordinate from "../entities/tiles/TileCoordinate";

export function lat_to_tile(lat: number, zoom: number) {
    // from https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
    return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI)
        / 2 * Math.pow(2, zoom));
}

export function long_to_tile(lon: number, zoom: number) {
    // from https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
    return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
}
export function toTileCoordinate(lat: number, long: number, zoom = 14): TileCoordinate {
    return new TileCoordinate(zoom, long_to_tile(long, zoom), lat_to_tile(lat, zoom));
}
