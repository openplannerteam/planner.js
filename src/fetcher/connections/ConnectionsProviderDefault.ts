import { AsyncIterator } from "asynciterator";
import { inject, injectable } from "inversify";
import Catalog, { IConnectionsSourceConfig } from "../../Catalog";
import IConnection from "../../entities/connections/connections";
import { LinkedConnectionsPage } from "../../entities/connections/page";
import TYPES, { ConnectionsFetcherFactory } from "../../types";
import MergeIterator from "../../util/iterators/MergeIterator";
import IHydraTemplateFetcher from "../hydra/IHydraTemplateFetcher";
import ConnectionsProviderSingle from "./ConnectionsProviderSingle";
import IConnectionsIteratorOptions from "./IConnectionsIteratorOptions";
import IConnectionsProvider from "./IConnectionsProvider";

@injectable()
export default class ConnectionsProviderDefault implements IConnectionsProvider {

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

  private singleProviders: ConnectionsProviderSingle[];
  private connectionsFetcherFactory: ConnectionsFetcherFactory;
  private templateFetcher: IHydraTemplateFetcher;

  constructor(
    @inject(TYPES.ConnectionsFetcherFactory) connectionsFetcherFactory: ConnectionsFetcherFactory,
    @inject(TYPES.Catalog) catalog: Catalog,
    @inject(TYPES.HydraTemplateFetcher) templateFetcher: IHydraTemplateFetcher,
  ) {
    this.singleProviders = [];
    this.connectionsFetcherFactory = connectionsFetcherFactory;
    this.templateFetcher = templateFetcher;

    for (const connectionSource of catalog.connectionsSourceConfigs) {
      this.addConnectionSource(connectionSource);
    }
  }

  public addConnectionSource(source: IConnectionsSourceConfig) {
    this.singleProviders.push(
      new ConnectionsProviderSingle(this.connectionsFetcherFactory, source, this.templateFetcher),
    );
  }

  public prefetchConnections(lowerBound: Date, upperBound: Date): void {
    for (const provider of this.singleProviders) {
      provider.prefetchConnections(lowerBound, upperBound);
    }
  }

  public async createIterator(options: IConnectionsIteratorOptions): Promise<AsyncIterator<IConnection>> {
    const iterators = await Promise.all(this.singleProviders
      .map((provider) => provider.createIterator(options)));

    const selector = options.backward ?
      ConnectionsProviderDefault.backwardsConnectionsSelector
      :
      ConnectionsProviderDefault.forwardsConnectionSelector;

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
