import { inject, injectable } from "inversify";
import Catalog from "../../Catalog";
import TYPES, { StopsFetcherFactory, RoutableTilesFetcherFactory } from "../../types";
import IRoutableTilesProvider from "./IRoutableTilesProvider";
import IRoutableTileFetcher from "./IRoutableTilesFetcher";
import IRoutableTilesNode from "./IRoutableTilesNode";

@injectable()
export default class RoutableTilesProviderDefault implements IRoutableTilesProvider {

  private tilesFetchers: IRoutableTileFetcher[];
  private tileFetcherFactory: RoutableTilesFetcherFactory;

  constructor(
    @inject(TYPES.RoutableTilesFetcherFactory) tileFetcherFactory: RoutableTilesFetcherFactory,
  ) {
    this.tilesFetchers = [];
    this.tileFetcherFactory = tileFetcherFactory;
  }

  public addFetcher(accessUrl: string) {
    this.tilesFetchers.push(this.tileFetcherFactory(accessUrl));
  }

  public prefetchTiles(): void {
    for (const tilesFetcher of this.tilesFetchers) {
      tilesFetcher.prefetchTiles();
    }
  }

  public async getNodeById(nodeId: string): Promise<IRoutableTilesNode> {
    return Promise.all(this.tilesFetchers
      .map((tilesFetcher: IRoutableTileFetcher) => tilesFetcher.getNodeById(nodeId)),
    ).then((results: IRoutableTilesNode[]) => results.find((node) => node !== undefined));
  }

  public async getAllNodes(): Promise<IRoutableTilesNode[]> {
    if (this.cachedStops.length > 0) {
      return Promise.resolve(this.cachedStops);
    }

    return Promise.all(this.stopsFetchers
      .map((stopsFetcher: IStopsFetcher) => stopsFetcher.getAllStops()),
    ).then((results: IStop[][]) => {
      this.cachedStops = [].concat(...results);

      return this.cachedStops;
    });
  }
}
