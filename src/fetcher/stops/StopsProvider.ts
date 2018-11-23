import { inject, injectable } from "inversify";
import Catalog from "../../Catalog";
import TYPES, { StopsFetcherFactory } from "../../types";
import IStop from "./IStop";
import IStopsFetcher from "./IStopsFetcher";
import IStopsProvider from "./IStopsProvider";

@injectable()
export default class StopsProvider implements IStopsProvider {

  private readonly stopsFetchers: IStopsFetcher[];

  constructor(
    @inject(TYPES.StopsFetcherFactory) stopsFetcherFactory: StopsFetcherFactory,
    @inject(TYPES.Catalog) catalog: Catalog,
  ) {
    this.stopsFetchers = [];

    for (const {prefix, accessUrl} of catalog.stopsFetcherConfigs) {
      this.stopsFetchers.push(stopsFetcherFactory(prefix, accessUrl));
    }
  }

  public async getStopById(stopId: string): Promise<IStop> {
    const fetcher = this.determineStopFetcher(stopId);

    if (fetcher) {
      return fetcher.getStopById(stopId);
    }
  }

  public async getAllStops(): Promise<IStop[]> {
    return Promise.all(this.stopsFetchers
      .map((stopsFetcher: IStopsFetcher) => stopsFetcher.getAllStops()),
    ).then((results: IStop[][]) => [].concat(...results));
  }

  private determineStopFetcher(stopId: string): IStopsFetcher {
    if (!this.stopsFetchers || !this.stopsFetchers.length) {
      return null;
    }

    return this.stopsFetchers
      .find((fetcher) => stopId.indexOf(fetcher.prefix) === 0);
  }
}
