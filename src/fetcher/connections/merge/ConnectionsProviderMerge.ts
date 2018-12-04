import { AsyncIterator } from "asynciterator";
import { injectable, multiInject, tagged } from "inversify";
import TYPES from "../../../types";
import IConnection from "../IConnection";
import IConnectionsFetcher from "../IConnectionsFetcher";
import IConnectionsFetcherConfig from "../IConnectionsFetcherConfig";
import ConnectionsIteratorMerge from "./ConnectionsIteratorMerge";

@injectable()
export default class ConnectionsProviderMerge implements IConnectionsFetcher {

  public createIterator: () => AsyncIterator<IConnection>;

  private config: IConnectionsFetcherConfig;
  private connectionsFetchers: IConnectionsFetcher[];

  constructor(
    @multiInject(TYPES.ConnectionsFetcher) @tagged("type", "source") connectionsFetchers: IConnectionsFetcher[],
  ) {
    this.connectionsFetchers = connectionsFetchers;
  }

  public setConfig(config: IConnectionsFetcherConfig): void {
    this.config = config;
    this.connectionsFetchers.forEach((fetcher) => {
      fetcher.setConfig(config);
    });
  }
}
