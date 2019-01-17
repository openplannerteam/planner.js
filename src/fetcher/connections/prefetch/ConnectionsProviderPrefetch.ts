import { AsyncIterator } from "asynciterator";
import { PromiseProxyIterator } from "asynciterator-promiseproxy";
import { inject, injectable } from "inversify";
import Catalog from "../../../Catalog";
import TYPES, { ConnectionsFetcherFactory } from "../../../types";
import IConnection from "../IConnection";
import IConnectionsFetcher from "../IConnectionsFetcher";
import IConnectionsFetcherConfig from "../IConnectionsFetcherConfig";
import IConnectionsProvider from "../IConnectionsProvider";
import ConnectionsStore from "./ConnectionsStore";

const MAX_CONNECTIONS = 20000;

/**
 * Passes through one [[IConnectionsFetcher]], the first one if there are multiple
 * This provider is most/only useful if there is only one fetcher
 */
@injectable()
export default class ConnectionsProviderPrefetch implements IConnectionsProvider {

  private readonly connectionsFetcher: IConnectionsFetcher;
  private readonly connectionsStore: ConnectionsStore;

  private startedPrefetching: boolean;
  private connectionsIterator: AsyncIterator<IConnection>;
  private connectionsFetcherConfig: IConnectionsFetcherConfig;

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
        const config: IConnectionsFetcherConfig = {
          backward: false,
          lowerBoundDate: new Date(),
        };

        this.connectionsFetcher.setConfig(config);
        this.connectionsIterator = this.connectionsFetcher.createIterator();

        this.connectionsIterator
          .take(MAX_CONNECTIONS)
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
        this.connectionsStore.getIterator(this.connectionsFetcherConfig),
      );
    }

    throw new Error("TODO");
  }

  public setConfig(config: IConnectionsFetcherConfig): void {
    this.connectionsFetcherConfig = config;
  }
}
