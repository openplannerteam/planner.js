import { injectable, multiInject } from "inversify";
import TYPES from "../../../types";
import IStop from "../IStop";
import IStopsFetcher from "../IStopsFetcher";
import IStopsFetcherMediator from "../IStopsFetcherMediator";

@injectable()
export default class StopsFetcherProxy implements IStopsFetcherMediator {

  private readonly stopsFetchers: IStopsFetcher[];

  constructor(
    @multiInject(TYPES.StopsFetcher) stopsFetchers: IStopsFetcher[],
  ) {
    this.stopsFetchers = stopsFetchers;
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
