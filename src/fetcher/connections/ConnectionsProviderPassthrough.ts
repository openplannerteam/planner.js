import { inject, injectable } from "inversify";
import Catalog from "../../Catalog";
import TYPES, { ConnectionsFetcherFactory } from "../../types";
import IConnection from "./IConnection";
import IConnectionsFetcher from "./IConnectionsFetcher";
import IConnectionsFetcherConfig from "./IConnectionsFetcherConfig";
import IConnectionsProvider from "./IConnectionsProvider";

/**
 * Passes through one [[IConnectionsFetcher]], the first one if there are multiple
 */
@injectable()
export default class ConnectionsProviderPassthrough implements IConnectionsProvider {

  private readonly connectionsFetcher: IConnectionsFetcher;

  constructor(
    @inject(TYPES.ConnectionsFetcherFactory) connectionsFetcherFactory: ConnectionsFetcherFactory,
    @inject(TYPES.Catalog) catalog: Catalog,
  ) {
    const { accessUrl, travelMode } = catalog.connectionsFetcherConfigs[0];

    this.connectionsFetcher = connectionsFetcherFactory(accessUrl, travelMode);
  }

  public [Symbol.asyncIterator](): AsyncIterator<IConnection> {
    return this.connectionsFetcher[Symbol.asyncIterator]();
  }

  public setConfig(config: IConnectionsFetcherConfig): void {
    this.connectionsFetcher.setConfig(config);
  }
}
