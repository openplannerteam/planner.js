import { AsyncIterator } from "asynciterator";
import { inject, injectable } from "inversify";
import Catalog from "../../Catalog";
import TYPES, { ConnectionsFetcherFactory } from "../../types";
import MergeIterator from "../../util/iterators/MergeIterator";
import IConnection from "./IConnection";
import IConnectionsFetcher from "./IConnectionsFetcher";
import IConnectionsIteratorOptions from "./IConnectionsIteratorOptions";
import IConnectionsProvider from "./IConnectionsProvider";

/**
 * Instantiates and merge sorts all registered connection fetchers
 */
@injectable()
export default class ConnectionsProviderMerge implements IConnectionsProvider {

  private static forwardsConnectionSelector(connections: IConnection[]): number {
    if (connections.length === 1) {
      return 0;
    }

    let earliestIndex = 0;
    const earliest = connections[earliestIndex];

    for (let i = 1; i < connections.length; i++) {
      const connection = connections[i];

      if (connection.departureTime < earliest.departureTime) {
        earliestIndex = i;
      }
    }

    return earliestIndex;
  }

  private static backwardsConnectionsSelector(connections: IConnection[]): number {
    if (connections.length === 1) {
      return 0;
    }

    let latestIndex = 0;
    const latest = connections[latestIndex];

    for (let i = 1; i < connections.length; i++) {
      const connection = connections[i];

      if (connection.departureTime > latest.departureTime) {
        latestIndex = i;
      }
    }

    return latestIndex;
  }

  private options: IConnectionsIteratorOptions;
  private connectionsFetchers: IConnectionsFetcher[];

  constructor(
    @inject(TYPES.ConnectionsFetcherFactory) connectionsFetcherFactory: ConnectionsFetcherFactory,
    @inject(TYPES.Catalog) catalog: Catalog,
  ) {
    this.connectionsFetchers = [];

    for (const { accessUrl, travelMode } of catalog.connectionsSourceConfigs) {
      this.connectionsFetchers.push(connectionsFetcherFactory(accessUrl, travelMode));
    }
  }

  public prefetchConnections(): void {
    return;
  }

  public createIterator(): AsyncIterator<IConnection> {

    const iterators = this.connectionsFetchers
      .map((fetcher) => fetcher.createIterator());

    const selector = this.options.backward ?
      ConnectionsProviderMerge.backwardsConnectionsSelector
      :
      ConnectionsProviderMerge.forwardsConnectionSelector;

    return new MergeIterator(iterators, selector, true);
  }

  public setIteratorOptions(options: IConnectionsIteratorOptions): void {
    this.options = options;
    this.connectionsFetchers.forEach((fetcher) => {
      fetcher.setIteratorOptions(options);
    });
  }
}
