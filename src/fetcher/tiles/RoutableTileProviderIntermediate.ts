import { inject, injectable } from "inversify";
import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";
import TYPES from "../../types";
import IRoutableTileFetcher from "./IRoutableTileFetcher";
import RoutableTileProviderDefault from "./RoutableTileProviderDefault";

@injectable()
export default class RoutableTileProviderIntermediate extends RoutableTileProviderDefault {

  constructor(
    @inject(TYPES.RoutableTileFetcher) fetcher: IRoutableTileFetcher,
  ) {
      super(fetcher);
  }

  public getIdForTileCoords(coordinate: RoutableTileCoordinate): string {
    return `https://hdelva.be/tiles/transit/${coordinate.zoom}/${coordinate.x}/${coordinate.y}`;
  }
}
