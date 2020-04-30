import ILocation from "../../interfaces/ILocation";
import TileCoordinate from "./TileCoordinate";
import { ZoiZone } from "./ZoiZone";

function tile_to_lat(coordinate: TileCoordinate) {
    // from https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
    const n = Math.PI - 2 * Math.PI * coordinate.y / Math.pow(2, coordinate.zoom);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}

function tile_to_long(coordinate: TileCoordinate) {
    // from https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
    return (coordinate.x / Math.pow(2, coordinate.zoom) * 360 - 180);
}

export class ZoiTile {
    public id: string;
    public coordinate?: TileCoordinate;
    protected zones: ZoiZone[];

    constructor(id: string, zones: ZoiZone[]) {
        this.id = id;
        this.zones = zones;
    }

    public getZones() {
        return this.zones;
    }
}

export interface IZoiTileIndex {
    [id: string]: Promise<ZoiTile>;
}
