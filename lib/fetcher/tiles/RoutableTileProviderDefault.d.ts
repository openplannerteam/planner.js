import { IRoutableTileIndex, RoutableTile } from "../../entities/tiles/RoutableTile";
import RoutableTileRegistry from "../../entities/tiles/RoutableTileRegistry";
import { RoutableTileSet } from "../../entities/tiles/RoutableTileSet";
import TileCoordinate from "../../entities/tiles/TileCoordinate";
import ILocation from "../../interfaces/ILocation";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import IRoutableTileFetcher from "./IRoutableTileFetcher";
import IRoutableTileProvider from "./IRoutableTileProvider";
export default class RoutableTileProviderDefault implements IRoutableTileProvider {
    protected fetcher: IRoutableTileFetcher;
    protected registry: RoutableTileRegistry;
    protected tiles: IRoutableTileIndex;
    protected pathfinderProvider: PathfinderProvider;
    constructor(pathfinderProvider: PathfinderProvider, fetcher: IRoutableTileFetcher);
    wait(): Promise<void>;
    getIdForLocation(zoom: number, location: ILocation): string;
    getIdForTileCoords(coordinate: TileCoordinate): string;
    getByLocation(zoom: number, location: ILocation): Promise<RoutableTile>;
    getByTileCoords(coordinate: TileCoordinate): Promise<RoutableTile>;
    getmultipleByLocation(zoom: number, locations: ILocation[]): Promise<RoutableTileSet>;
    getMultipleByTileCoords(coordinates: TileCoordinate[]): Promise<RoutableTileSet>;
    protected getByUrl(url: string): Promise<RoutableTile>;
    private long2tile;
    private lat2tile;
}
