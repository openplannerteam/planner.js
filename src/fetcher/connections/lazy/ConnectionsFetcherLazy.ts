import { AsyncIterator } from "asynciterator";
import { inject, injectable } from "inversify";
import LDFetch from "ldfetch";
import TravelMode from "../../../enums/TravelMode";
import TYPES from "../../../types";
import IConnection from "../IConnection";
import IConnectionsFetcher from "../IConnectionsFetcher";
import IConnectionsIteratorOptions from "../IConnectionsIteratorOptions";
import ConnectionsIteratorLazy from "./ConnectionsIteratorLazy";

/**
 * Wraps the [[ConnectionsIteratorLazy]]
 * @implements IConnectionsFetcher
 */
@injectable()
export default class ConnectionsFetcherLazy implements IConnectionsFetcher {

  protected readonly ldFetch: LDFetch;
  protected options: IConnectionsIteratorOptions;
  private travelMode: TravelMode;
  private accessUrl: string;

  constructor(@inject(TYPES.LDFetch) ldFetch: LDFetch) {
    this.ldFetch = ldFetch;
  }

  public setTravelMode(travelMode: TravelMode) {
    this.travelMode = travelMode;
  }

  public setAccessUrl(accessUrl: string) {
    this.accessUrl = accessUrl;
  }

  public prefetchConnections(): void {
    return;
  }

  public createIterator(): AsyncIterator<IConnection> {
    return new ConnectionsIteratorLazy(
      this.accessUrl,
      this.travelMode,
      this.ldFetch,
      this.options,
    );
  }

  public setIteratorOptions(options: IConnectionsIteratorOptions): void {
    this.options = options;
  }
}
