import TileCoordinate from "../../entities/tiles/TileCoordinate";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import IRoutableTileFetcher from "./IRoutableTileFetcher";
import RoutableTileProviderDefault from "./RoutableTileProviderDefault";
export default class RoutableTileProviderIntermediate extends RoutableTileProviderDefault {
    constructor(pathfinderProvider: PathfinderProvider, fetcher: IRoutableTileFetcher);
    getIdForTileCoords(coordinate: TileCoordinate): string;
}
