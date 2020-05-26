import { inject, injectable } from "inversify";
import TileCoordinate from "../../entities/tiles/TileCoordinate";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import TYPES from "../../types";
import IRoutableTileFetcher from "./IRoutableTileFetcher";
import RoutableTileProviderDefault from "./RoutableTileProviderDefault";

@injectable()
export default class RoutableTileProviderTransit extends RoutableTileProviderDefault {

  constructor(
    @inject(TYPES.PathfinderProvider) pathfinderProvider: PathfinderProvider,
    @inject(TYPES.RoutableTileFetcher) fetcher: IRoutableTileFetcher,
  ) {
      super(pathfinderProvider, fetcher);
  }

  public getIdForTileCoords(coordinate: TileCoordinate): string {
    return `https://hdelva.be/tiles/reduced/${coordinate.zoom}/${coordinate.x}/${coordinate.y}`;
  }
}
