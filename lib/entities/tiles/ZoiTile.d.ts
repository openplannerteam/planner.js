import TileCoordinate from "./TileCoordinate";
import { ZoiZone } from "./ZoiZone";
export declare class ZoiTile {
    id: string;
    coordinate?: TileCoordinate;
    protected zones: ZoiZone[];
    constructor(id: string, zones: ZoiZone[]);
    getZones(): ZoiZone[];
}
export interface IZoiTileIndex {
    [id: string]: Promise<ZoiTile>;
}
