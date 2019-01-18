import { AsyncIterator } from "asynciterator";
import { PromiseProxyIterator } from "asynciterator-promiseproxy";
import { inject, injectable } from "inversify";
import Catalog from "../../../Catalog";
import TYPES, { ConnectionsFetcherFactory } from "../../../types";
import IConnection from "../IConnection";
import IConnectionsFetcher from "../IConnectionsFetcher";
import IConnectionsIteratorOptions from "../IConnectionsIteratorOptions";
import IConnectionsProvider from "../IConnectionsProvider";
import ConnectionsStore from "./ConnectionsStore";

/**
 * Passes through one [[IConnectionsFetcher]], the first one if there are multiple
 * This provider is most/only useful if there is only one fetcher
 */
@injectable()
export default class ConnectionsProviderPrefetch implements IConnectionsProvider {

  private static MAX_CONNECTIONS = 20000;

  private readonly connectionsFetcher: IConnectionsFetcher;
  private readonly connectionsStore: ConnectionsStore;

  private startedPrefetching: boolean;
  private connectionsIterator: AsyncIterator<IConnection>;
  private connectionsIteratorOptions: IConnectionsIteratorOptions;

  constructor(
    @inject(TYPES.ConnectionsFetcherFactory) connectionsFetcherFactory: ConnectionsFetcherFactory,
    @inject(TYPES.Catalog) catalog: Catalog,
  ) {
    const { accessUrl, travelMode } = catalog.connectionsSourceConfigs[0];

    this.connectionsFetcher = connectionsFetcherFactory(accessUrl, travelMode);
    this.connectionsStore = new ConnectionsStore();
  }

  public prefetchConnections(): void {
    if (!this.startedPrefetching) {
      this.startedPrefetching = true;

      setTimeout(() => {
        const options: IConnectionsIteratorOptions = {
          backward: false,
          lowerBoundDate: new Date(),
        };

        this.connectionsFetcher.setIteratorOptions(options);
        this.connectionsIterator = this.connectionsFetcher.createIterator();

        this.connectionsIterator
          .take(ConnectionsProviderPrefetch.MAX_CONNECTIONS)
          .on("end", () => this.connectionsStore.finish())
          .each((connection: IConnection) => {
            this.connectionsStore.append(connection);
          });
      }, 0);
    }
  }

  public createIterator(): AsyncIterator<IConnection> {
    if (this.startedPrefetching) {
      return new PromiseProxyIterator(() =>
        this.connectionsStore.getIterator(this.connectionsIteratorOptions),
      );
    }

    throw new Error("TODO");
  }

  public setIteratorOptions(options: IConnectionsIteratorOptions): void {
    this.connectionsIteratorOptions = options;
  }
}
