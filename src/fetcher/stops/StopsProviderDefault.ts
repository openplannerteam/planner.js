import { inject, injectable } from "inversify";
import Catalog from "../../Catalog";
import TYPES, { StopsFetcherFactory } from "../../types";
import IStop from "./IStop";
import IStopsFetcher from "./IStopsFetcher";
import IStopsProvider from "./IStopsProvider";

@injectable()
export default class StopsProviderDefault implements IStopsProvider {

  private readonly stopsFetchers: IStopsFetcher[];
  private cachedStops: IStop[];

  constructor(
    @inject(TYPES.StopsFetcherFactory) stopsFetcherFactory: StopsFetcherFactory,
    @inject(TYPES.Catalog) catalog: Catalog,
  ) {
    this.stopsFetchers = [];
    this.cachedStops = [];

    for (const { accessUrl } of catalog.stopsSourceConfigs) {
      this.stopsFetchers.push(stopsFetcherFactory(accessUrl));
    }
  }

  public prefetchStops(): void {
    for (const stopsFetcher of this.stopsFetchers) {
      stopsFetcher.prefetchStops();
    }
  }

  public async getStopById(stopId: string): Promise<IStop> {
    return Promise.all(this.stopsFetchers
      .map((stopsFetcher: IStopsFetcher) => stopsFetcher.getStopById(stopId)),
    ).then((results: IStop[]) => results.find((stop) => stop !== undefined));
  }

  public async getAllStops(): Promise<IStop[]> {
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
