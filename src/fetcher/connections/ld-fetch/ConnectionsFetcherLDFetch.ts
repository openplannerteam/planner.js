import { inject, injectable } from "inversify";
import LDFetch from "ldfetch";
import TravelMode from "../../../TravelMode";
import TYPES from "../../../types";
import IConnection from "../IConnection";
import IConnectionsFetcher from "../IConnectionsFetcher";
import IConnectionsFetcherConfig from "../IConnectionsFetcherConfig";
import ConnectionsIteratorLDFetch from "./ConnectionsIteratorLDFetch";

/**
 * Wraps the [[ConnectionsIteratorLDFetch]] for use in a for-await-of statement
 * @implements IConnectionsFetcher
 */
@injectable()
export default class ConnectionsFetcherLDFetch implements IConnectionsFetcher {

  protected readonly ldFetch: LDFetch;
  protected config: IConnectionsFetcherConfig;
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

  /**
   * Called by the semantics of the for-await-of statement.
   */
  public [Symbol.asyncIterator](): AsyncIterator<IConnection> {
    return this.fetch();
  }

  public fetch(): AsyncIterator<IConnection> {
    return new ConnectionsIteratorLDFetch(
      this.accessUrl,
      this.travelMode,
      this.ldFetch,
      this.config,
    );
  }

  public setConfig(config: IConnectionsFetcherConfig): void {
    this.config = config;
  }
}
