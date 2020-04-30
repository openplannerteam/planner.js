import ILocation from "../../interfaces/ILocation";
import TileCoordinate from "./TileCoordinate";

function tile_to_lat(coordinate: TileCoordinate) {
    // from https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
    const n = Math.PI - 2 * Math.PI * coordinate.y / Math.pow(2, coordinate.zoom);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}

function tile_to_long(coordinate: TileCoordinate) {
    // from https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
    return (coordinate.x / Math.pow(2, coordinate.zoom) * 360 - 180);
}

export class RoutableTile {
    public id: string;
    public coordinate?: TileCoordinate;
    protected nodes: Set<string>;
    protected ways: Set<string>;

    constructor(id: string, nodes: Set<string>, ways: Set<string>) {
        this.id = id;
        this.nodes = nodes;
        this.ways = ways;
    }

    public getWays() {
        return this.ways;
    }

    public getNodes() {
        return this.nodes;
    }

    public contains(location: ILocation): boolean {
        const top = tile_to_lat(this.coordinate);
        const left = tile_to_long(this.coordinate);

        const next = new TileCoordinate(this.coordinate.zoom, this.coordinate.x + 1, this.coordinate.y + 1);

        const bottom = tile_to_lat(next);
        const right = tile_to_long(next);

        if (location.latitude > top || location.latitude < bottom) {
            return false;
        } else if (location.longitude < left || location.longitude > right) {
            return false;
        }
        return true;
    }
}

export interface IRoutableTileIndex {
    [id: string]: Promise<RoutableTile>;
}
