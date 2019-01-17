import { inject, injectable } from "inversify";
import Catalog from "../../Catalog";
import TYPES, { StopsFetcherFactory } from "../../types";
import IStop from "./IStop";
import IStopsFetcher from "./IStopsFetcher";
import IStopsProvider from "./IStopsProvider";

@injectable()
export default class StopsProviderDefault implements IStopsProvider {

  private readonly stopsFetchers: IStopsFetcher[];

  constructor(
    @inject(TYPES.StopsFetcherFactory) stopsFetcherFactory: StopsFetcherFactory,
    @inject(TYPES.Catalog) catalog: Catalog,
  ) {
    this.stopsFetchers = [];

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
    return Promise.all(this.stopsFetchers
      .map((stopsFetcher: IStopsFetcher) => stopsFetcher.getAllStops()),
    ).then((results: IStop[][]) => [].concat(...results));
  }
}
