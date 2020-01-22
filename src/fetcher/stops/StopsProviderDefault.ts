import { inject, injectable } from "inversify";
import { IStopsSourceConfig } from "../../Catalog";
import TYPES, { StopsFetcherFactory } from "../../types";
import IStop from "./IStop";
import IStopsFetcher from "./IStopsFetcher";
import IStopsProvider from "./IStopsProvider";

@injectable()
export default class StopsProviderDefault implements IStopsProvider {

  private readonly stopsFetchers: IStopsFetcher[];
  private cachedStops: IStop[];
  private allStops: Promise<IStop[]>;
  private stopsFetcherFactory: StopsFetcherFactory;
  private sources: IStopsSourceConfig[];

  constructor(
    @inject(TYPES.StopsFetcherFactory) stopsFetcherFactory: StopsFetcherFactory,
  ) {
    this.sources = [];
    this.stopsFetchers = [];
    this.cachedStops = [];
    this.stopsFetcherFactory = stopsFetcherFactory;
  }

  public addStopSource(source: IStopsSourceConfig) {
    this.sources.push(source);
    this.cachedStops = [];
    this.allStops = null;
    this.stopsFetchers.push(this.stopsFetcherFactory(source.accessUrl));
  }

  public getSources(): IStopsSourceConfig[] {
    return this.sources;
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
    if (!this.allStops) {
      if (this.cachedStops.length > 0) {
        return Promise.resolve(this.cachedStops);
      }

      this.allStops = Promise.all(this.stopsFetchers
        .map((stopsFetcher: IStopsFetcher) => stopsFetcher.getAllStops()),
      ).then((results: IStop[][]) => {
        this.cachedStops = [].concat(...results);

        return this.cachedStops;
      });
    }

    return this.allStops;
  }
}
