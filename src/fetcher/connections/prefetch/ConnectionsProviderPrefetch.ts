import { AsyncIterator } from "asynciterator";
import { inject, injectable } from "inversify";
import Catalog from "../../../Catalog";
import Context from "../../../Context";
import EventType from "../../../enums/EventType";
import TYPES, { ConnectionsFetcherFactory } from "../../../types";
import Units from "../../../util/Units";
import IConnection from "../IConnection";
import IConnectionsFetcher from "../IConnectionsFetcher";
import IConnectionsIteratorOptions from "../IConnectionsIteratorOptions";
import IConnectionsProvider from "../IConnectionsProvider";
import ConnectionsStore from "./ConnectionsStore";

/**
 * This connections provider implements the [[IConnectionsProvider.prefetchConnections]] method.
 * When called, it asks an AsyncIterator from the instantiated [[IConnectionsFetcher]].
 * All items from that iterator get appended to a [[ConnectionsStore]]
 *
 * When [[IConnectionsProvider.createIterator]] is called, it returns an iterator *view* from the [[ConnectionsStore]]
 */
@injectable()
export default class ConnectionsProviderPrefetch implements IConnectionsProvider {

  private static MAX_CONNECTIONS = 20000;
  private static REPORTING_THRESHOLD = Units.fromHours(.25);

  private readonly context: Context;
  private readonly connectionsFetcher: IConnectionsFetcher;
  private readonly connectionsStore: ConnectionsStore;

  private startedPrefetching: boolean;
  private connectionsIterator: AsyncIterator<IConnection>;
  private connectionsIteratorOptions: IConnectionsIteratorOptions;
  private lastReportedDepartureTime: Date;

  constructor(
    @inject(TYPES.ConnectionsFetcherFactory) connectionsFetcherFactory: ConnectionsFetcherFactory,
    @inject(TYPES.Catalog) catalog: Catalog,
    @inject(TYPES.Context) context: Context,
  ) {
    const { accessUrl, travelMode } = catalog.connectionsSourceConfigs[0];

    this.context = context;
    this.connectionsFetcher = connectionsFetcherFactory(accessUrl, travelMode);
    this.connectionsStore = new ConnectionsStore(context);
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

            if (this.context) {
              this.maybeEmitPrefetchEvent(connection);
            }

            this.connectionsStore.append(connection);
          });
      }, 0);
    }
  }

  public createIterator(): AsyncIterator<IConnection> {
    if (this.startedPrefetching) {
      return this.connectionsStore
        .getIterator(this.connectionsIteratorOptions);
    }

    throw new Error("TODO");
  }

  public setIteratorOptions(options: IConnectionsIteratorOptions): void {
    this.connectionsIteratorOptions = options;
  }

  private maybeEmitPrefetchEvent(connection: IConnection): void {
    if (!this.lastReportedDepartureTime) {
      this.lastReportedDepartureTime = connection.departureTime;

      this.context.emit(EventType.ConnectionPrefetch, this.lastReportedDepartureTime);
      return;
    }

    const timeSinceLastEvent = connection.departureTime.valueOf() - this.lastReportedDepartureTime.valueOf();

    if (timeSinceLastEvent > ConnectionsProviderPrefetch.REPORTING_THRESHOLD) {
      this.lastReportedDepartureTime = connection.departureTime;

      this.context.emit(EventType.ConnectionPrefetch, this.lastReportedDepartureTime);
    }
  }
}
