import { IRoutableTileIndex, RoutableTile } from "../../entities/tiles/RoutableTile";
import RoutableTileRegistry from "../../entities/tiles/RoutableTileRegistry";
import TileCoordinate from "../../entities/tiles/TileCoordinate";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import IRoutableTileFetcher from "./IRoutableTileFetcher";
import IZoiTileFetcher from "./IZoiTileFetcherRaw";
import RoutableTileProviderDefault from "./RoutableTileProviderDefault";
export default class CompositeTileProvider extends RoutableTileProviderDefault {
    protected fetcher: IRoutableTileFetcher;
    protected registry: RoutableTileRegistry;
    protected tiles: IRoutableTileIndex;
    protected pathfinderProvider: PathfinderProvider;
    protected zoiFetcher: IZoiTileFetcher;
    constructor(pathfinderProvider: PathfinderProvider, fetcher: IRoutableTileFetcher);
    getByTileCoords(coordinate: TileCoordinate): Promise<RoutableTile>;
    getIdForTileCoords(coordinate: TileCoordinate): string;
    protected getByUrl(url: string, zoiUrl?: string): Promise<RoutableTile>;
    private getZoiIdForTileCoords;
}
