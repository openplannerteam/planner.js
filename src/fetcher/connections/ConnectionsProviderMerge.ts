import { AsyncIterator } from "asynciterator";
import { inject, injectable } from "inversify";
import Catalog from "../../Catalog";
import IConnection from "../../entities/connections/connections";
import { LinkedConnectionsPage } from "../../entities/connections/page";
import TYPES, { ConnectionsFetcherFactory } from "../../types";
import MergeIterator from "../../util/iterators/MergeIterator";
import ConnectionsProviderDefault from "./ConnectionsProviderDefault";
import IConnectionsIteratorOptions from "./IConnectionsIteratorOptions";
import IConnectionsProvider from "./IConnectionsProvider";

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

  private defaultProviders: IConnectionsProvider[];

  constructor(
    @inject(TYPES.ConnectionsFetcherFactory) connectionsFetcherFactory: ConnectionsFetcherFactory,
    @inject(TYPES.Catalog) catalog: Catalog,
  ) {
    this.defaultProviders = [];

    for (const { accessUrl, travelMode } of catalog.connectionsSourceConfigs) {
      const subCatalog = new Catalog();
      subCatalog.addConnectionsSource(accessUrl, travelMode);
      this.defaultProviders.push(new ConnectionsProviderDefault(connectionsFetcherFactory, subCatalog));
    }
  }

  public prefetchConnections(): void {
    return;
  }

  public createIterator(options: IConnectionsIteratorOptions): AsyncIterator<IConnection> {
    const iterators = this.defaultProviders
      .map((provider) => provider.createIterator(options));

    const selector = options.backward ?
      ConnectionsProviderMerge.backwardsConnectionsSelector
      :
      ConnectionsProviderMerge.forwardsConnectionSelector;

    if (options.excludedModes) {
      return new MergeIterator(iterators, selector, true).filter((item) => {
        return !options.excludedModes.has(item.travelMode);
      });
    } else {
      return new MergeIterator(iterators, selector, true);
    }
  }

  public getByUrl(url: string): Promise<LinkedConnectionsPage> {
    // TODO, if needed this can delegate the call to one of the sub providers
    throw new Error("Not implemented yet");
  }

  public getByTime(date: Date): Promise<LinkedConnectionsPage> {
    throw new Error("Method not implemented because the semantics would be ambiguous.");
  }
}
