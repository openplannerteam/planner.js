import { injectable } from "inversify";
import LdFetch from "ldfetch";
import IConnection from "../IConnection";
import IConnectionsFetcher from "../IConnectionsFetcher";
import IConnectionsFetcherConfig from "../IConnectionsFetcherConfig";
import ConnectionsIteratorLDFetch from "./ConnectionsIteratorLDFetch";

const IRAIL_CONNECTIONS_BASE_URL = "https://graph.irail.be/sncb/connections";

@injectable()
export default class ConnectionsFetcherLDFetch implements IConnectionsFetcher {

  private readonly ldFetch: LdFetch;
  private config: IConnectionsFetcherConfig;

  constructor() {
    this.ldFetch = new LdFetch();
    this.setupDebug();
  }

  public [Symbol.asyncIterator](): AsyncIterator<IConnection> {
    return this.fetch();
  }

  public fetch(): AsyncIterator<IConnection> {
    return new ConnectionsIteratorLDFetch(
      IRAIL_CONNECTIONS_BASE_URL,
      this.ldFetch,
      this.config,
    );
  }

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
      console.error(`HTTP GET - ${url} (${httpResponseTimes[url]}ms)`);
    });
  }
}
