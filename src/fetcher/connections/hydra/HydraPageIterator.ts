import { BufferedIterator } from "asynciterator";
import LdFetch from "ldfetch";
import UriTemplate from "uritemplate";
import HydraPageParser2 from "./HydraPageParser";
import IHydraPage from "./IHydraPage";
import IHydraPageIteratorConfig from "./IHydraPageIteratorConfig";

export default class HydraPageIterator extends BufferedIterator<IHydraPage> {
  private readonly baseUrl: string;
  private readonly ldFetch: LdFetch;
  private readonly config: IHydraPageIteratorConfig;

  private currentPage: IHydraPage;

  constructor(
    baseUrl: string,
    ldFetch: LdFetch,
    config: IHydraPageIteratorConfig,
  ) {
    super({
      autoStart: true,
    });

    this.baseUrl = baseUrl;
    this.ldFetch = ldFetch;
    this.config = config;
  }

  public _begin(done: () => void): void {
    this.ldFetch.get(this.baseUrl)
      .then((response) => {
        const parser = new HydraPageParser2(response.triples);
        const searchTemplate: UriTemplate = parser.getSearchTemplate();

        const firstPageIri = searchTemplate.expand(this.config.initialTemplateVariables);

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

        const parser = new HydraPageParser2(response.triples);
        const page = parser.getPage(0);

        if (this.config.backward) {
          page.previousPageIri = parser.getPreviousPageIri();

        } else {
          page.nextPageIri = parser.getNextPageIri();
        }

        this.currentPage = page;
        this._push(this.currentPage);
      });
  }
}
