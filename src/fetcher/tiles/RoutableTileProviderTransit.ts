import { inject, injectable } from "inversify";
import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";
import RoutableTileRegistry from "../../entities/tiles/registry";
import TYPES from "../../types";
import IRoutableTileFetcher from "./IRoutableTileFetcher";
import RoutableTileProviderDefault from "./RoutableTileProviderDefault";

@injectable()
export default class RoutableTileProviderTransit extends RoutableTileProviderDefault {

  constructor(
    @inject(TYPES.RoutableTileFetcher) fetcher: IRoutableTileFetcher,
    @inject(TYPES.RoutableTileRegistry) registry: RoutableTileRegistry,
  ) {
      super(fetcher, registry);
  }

  public getIdForTileCoords(coordinate: RoutableTileCoordinate): string {
    return `https://hdelva.be/tiles/reduced/${coordinate.zoom}/${coordinate.x}/${coordinate.y}`;
  }
}
