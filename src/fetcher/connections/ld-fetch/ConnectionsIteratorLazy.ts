import { BufferedIterator } from "asynciterator";
import LdFetch from "ldfetch";
import UriTemplate from "uritemplate";
import TravelMode from "../../../TravelMode";
import IConnection from "../IConnection";
import IConnectionsFetcherConfig from "../IConnectionsFetcherConfig";
import HydraPageParser from "./HydraPageParser";
import IHydraPage from "./IHydraPage";

/**
 * Base class for fetching linked connections with LDFetch and letting the caller iterate over them asynchronously
 * through implementing the AsyncIterator protocol.
 * LDFetch returns documents as an array of RDF triples.
 * The meta Hydra triples are used for paginating to the next or previous page.
 * The triples that describe linked connections get deserialized to instances of [[IConnection]]
 */
export default class ConnectionsIteratorLazy extends BufferedIterator<IConnection> {
  private readonly baseUrl: string;
  private readonly travelMode: TravelMode;
  private readonly ldFetch: LdFetch;
  private readonly config: IConnectionsFetcherConfig;

  private currentPage: IHydraPage;

  constructor(
    baseUrl: string,
    travelMode: TravelMode,
    ldFetch: LdFetch,
    config: IConnectionsFetcherConfig,
  ) {
    super({
      autoStart: true,
    });

    this.baseUrl = baseUrl;
    this.travelMode = travelMode;
    this.ldFetch = ldFetch;
    this.config = config;
  }

  public _begin(done: () => void): void {
    this.ldFetch.get(this.baseUrl)
      .then((response) => {
        const parser = new HydraPageParser(response.triples);
        const searchTemplate: UriTemplate = parser.getSearchTemplate();

        const departureTimeDate = this.config.backward ?
          this.config.upperBoundDate : this.config.lowerBoundDate;

        const firstPageIri = searchTemplate.expand({
          departureTime: departureTimeDate.toISOString(),
        });

        this.loadPage(firstPageIri)
          .then(() => done());
      });
  }

  public _read(count: number, done: () => void): void {

    const pageIri = this.config.backward ?
      this.currentPage.previousPageIri : this.currentPage.nextPageIri;

    this.loadPage(pageIri)
      .then(() => done());
  }

  private async loadPage(url: string) {
    await this.ldFetch.get(url)
      .then((response) => {

        const parser = new HydraPageParser(response.triples);
        const page = parser.getPage(0, this.travelMode);

        if (this.config.backward) {
          page.previousPageIri = parser.getPreviousPageIri();

        } else {
          page.nextPageIri = parser.getNextPageIri();
        }

        this.currentPage = page;
        this.pushCurrentPage();
      });
  }

  private pushCurrentPage(): void {
    const { connections } = this.currentPage;

    if (this.config.backward) {
      let c = connections.length - 1;

      while (c >= 0) {
        this._push(connections[c]);
        c--;
      }

      // Forwards
    } else {
      for (const connection of connections) {
        this._push(connection);
      }
    }
  }

}
