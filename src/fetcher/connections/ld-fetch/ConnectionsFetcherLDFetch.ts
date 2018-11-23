import { inject, injectable } from "inversify";
import LDFetch from "ldfetch";
import TYPES from "../../../types";
import IConnection from "../IConnection";
import IConnectionsFetcher from "../IConnectionsFetcher";
import IConnectionsFetcherConfig from "../IConnectionsFetcherConfig";

/**
 * Wraps the [[ConnectionsIteratorLDFetch]] for use in a for-await-of statement
 * @implements IConnectionsFetcher
 */
@injectable()
export default abstract class ConnectionsFetcherLDFetch implements IConnectionsFetcher {

  protected readonly ldFetch: LDFetch;
  protected config: IConnectionsFetcherConfig;

  constructor(@inject(TYPES.LDFetch) ldFetch: LDFetch) {
    this.ldFetch = ldFetch;
  }

  /**
   * Called by the semantics of the for-await-of statement.
   */
  public [Symbol.asyncIterator](): AsyncIterator<IConnection> {
    return this.fetch();
  }

  public abstract fetch(): AsyncIterator<IConnection>;

  public setConfig(config: IConnectionsFetcherConfig): void {
    this.config = config;
  }
}
