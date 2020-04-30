import TileCoordinate from "./TileCoordinate";
import { ZoiZone } from "./ZoiZone";

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
