import LdFetch from "ldfetch";
import { Util } from "n3";
import UriTemplate from "uritemplate";
import TravelMode from "../../../TravelMode";
import IConnection from "../IConnection";
import IConnectionsFetcherConfig from "../IConnectionsFetcherConfig";
import HydraPageParser from "./HydraPageParser";

export default class ConnectionsIteratorLDFetch implements AsyncIterator<IConnection> {
  public readonly baseUrl: string;
  private travelMode: TravelMode;
  private ldFetch: LdFetch;

  private connections: IConnection[];
  private config: IConnectionsFetcherConfig;

  private previousPageIri: string;
  private nextPageIri: string;

  constructor(
    baseUrl: string,
    travelMode: TravelMode,
    ldFetch: LdFetch,
    config: IConnectionsFetcherConfig,
    ) {
    this.baseUrl = baseUrl;
    this.travelMode = travelMode;
    this.ldFetch = ldFetch;
    this.config = config;
  }

  public async next(): Promise<IteratorResult<IConnection>> {
    if (!this.connections) {
      await this.discover();

    } else if (this.connections.length === 0) {
      const pageIri = this.config.backward ?
        this.previousPageIri : this.nextPageIri;

      await this.loadPage(pageIri);
    }

    let value;
    if (this.config.backward) {
      value = this.connections.pop();
      while (this.connections.length > 0 && value.arrivalTime > this.config.upperBoundDate) {
        value = this.connections.pop();

        if (!value) {
          await this.loadPage(this.previousPageIri);
          value = this.connections.pop();
        }
      }

      if (!value) {
        return {value, done: true};
      }

    } else {
      value = this.connections.shift();
    }

    return { value, done: false };
  }

  public return(): Promise<IteratorResult<IConnection>> {
    return undefined;
  }

  public throw(e?: any): Promise<IteratorResult<IConnection>> {
    return undefined;
  }

  private async discover(): Promise<void> {
    await this.ldFetch.get(this.baseUrl)
      .then(async (response) => {
        const parser = new HydraPageParser(response.triples);
        const searchTemplate: UriTemplate = parser.getSearchTemplate();

        const departureTimeDate = this.config.backward ?
          this.config.upperBoundDate : this.config.lowerBoundDate;

        const firstPageIri = searchTemplate.expand({
          departureTime: departureTimeDate.toISOString(),
        });

        await this.loadPage(firstPageIri);
      });
  }

  private async loadPage(url: string) {
    await this.ldFetch.get(url)
      .then((response) => {

        const parser = new HydraPageParser(response.triples);
        const page = parser.getPage(0, this.travelMode);

        this.nextPageIri = parser.getNextPageIri();
        this.previousPageIri = parser.getPreviousPageIri();
        this.connections = page.connections;
      });
  }
}
