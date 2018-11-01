import { injectable, multiInject, tagged } from "inversify";
import TYPES from "../../../types";
import IConnection from "../IConnection";
import IConnectionsFetcher from "../IConnectionsFetcher";
import IConnectionsFetcherConfig from "../IConnectionsFetcherConfig";
import ConnectionsIteratorMerge from "./ConnectionsIteratorMerge";

@injectable()
export default class ConnectionsFetcherMerge implements IConnectionsFetcher {

  private config: IConnectionsFetcherConfig;
  private connectionsFetchers: IConnectionsFetcher[];

  constructor(
    @multiInject(TYPES.ConnectionsFetcher) @tagged("type", "source") connectionsFetchers: IConnectionsFetcher[],
  ) {
    this.connectionsFetchers = connectionsFetchers;
  }

  public [Symbol.asyncIterator](): AsyncIterator<IConnection> {
    const iterators = this.connectionsFetchers.map((fetcher) => fetcher[Symbol.asyncIterator]());

    return new ConnectionsIteratorMerge(iterators, this.config);
  }

  public setConfig(config: IConnectionsFetcherConfig): void {
    this.config = config;
    this.connectionsFetchers.forEach((fetcher) => {
      fetcher.setConfig(config);
    });
  }
}
