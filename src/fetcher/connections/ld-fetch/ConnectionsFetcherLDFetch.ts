import { injectable } from "inversify";
import LdFetch from "ldfetch";
import IConnection from "../IConnection";
import IConnectionsFetcher from "../IConnectionsFetcher";
import IConnectionsFetcherConfig from "../IConnectionsFetcherConfig";

/**
 * Wraps the [[ConnectionsIteratorLDFetch]] for use in a for-await-of statement
 * @implements IConnectionsFetcher
 */
@injectable()
export default abstract class ConnectionsFetcherLDFetch implements IConnectionsFetcher {

  protected readonly ldFetch: LdFetch;
  protected config: IConnectionsFetcherConfig;

  constructor() {
    this.ldFetch = new LdFetch();
    this.setupDebug();
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

  private setupDebug() {
    const httpStartTimes = {};
    const httpResponseTimes = {};

    this.ldFetch.on("request", (url) => {
      httpStartTimes[url] = new Date();
    });

    this.ldFetch.on("redirect", (obj) => {
      httpStartTimes[obj.to] = httpStartTimes[obj.from];
    });

    this.ldFetch.on("response", (url) => {
      httpResponseTimes[url] = (new Date()).getTime() - httpStartTimes[url].getTime();
      console.log(`HTTP GET - ${url} (${httpResponseTimes[url]}ms)`);
    });
  }
}
