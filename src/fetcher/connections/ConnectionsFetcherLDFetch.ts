import { AsyncIterator } from "asynciterator";
import { injectable } from "inversify";
import IConnection from "./IConnection";
import IConnectionsFetcher from "./IConnectionsFetcher";
import LdFetch from "ldfetch";
import LCConnectionProvider from "./FetcherLDFetch/LCConnectionProvider";


@injectable()
export default class ConnectionsFetcherLDFetch implements IConnectionsFetcher {

  readonly baseUrl: string = "https://graph.irail.be/sncb/connections";
  readonly ldFetch;

  constructor() {
    this.ldFetch = new LdFetch();

    let httpStartTimes = {};
    let httpResponseTimes = {};

    this.ldFetch.on('request', function (url) {
      httpStartTimes[url] = new Date();
    });

    this.ldFetch.on('redirect', function (obj) {
      httpStartTimes[obj.to] = httpStartTimes[obj.from];
    });

    this.ldFetch.on('response', function (url) {
      httpResponseTimes[url] = (new Date()).getTime() - httpStartTimes[url].getTime();
       console.error('HTTP GET - ' + url + ' (' + httpResponseTimes[url] + 'ms)');
    });
  }

  fetch(): AsyncIterator<IConnection> {
    return new LCConnectionProvider(this.baseUrl, this.ldFetch);
  }
}
