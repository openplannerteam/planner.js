import ILocation from "../../interfaces/ILocation";
import TileCoordinate from "./TileCoordinate";
export declare class RoutableTile {
    id: string;
    coordinate?: TileCoordinate;
    protected nodes: Set<string>;
    protected ways: Set<string>;
    constructor(id: string, nodes: Set<string>, ways: Set<string>);
    getWays(): Set<string>;
    getNodes(): Set<string>;
    contains(location: ILocation): boolean;
}
export interface IRoutableTileIndex {
    [id: string]: Promise<RoutableTile>;
}
