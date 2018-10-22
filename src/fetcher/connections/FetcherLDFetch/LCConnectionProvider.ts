import { BufferedIterator } from "asynciterator";
import IConnection from "../IConnection";
import LdFetch from "ldfetch";
import ITriple from "./ITriple";
import {Util} from "n3";
import UriTemplate from "uritemplate";


export default class LCConnectionProvider extends BufferedIterator<IConnection> {
  private ldFetch: LdFetch;
  readonly baseUrl: string;

  private connections: IConnection[];
  private upperBoundDate: Date = new Date();
  private lowerBoundDate: Date = new Date();
  private config: {backward: boolean};

  private previousPageIri: string;
  private nextPageIri: string;

  constructor(baseUrl: string, ldFetch: LdFetch, config: {backward: boolean} = {backward: true}) {
    super();

    this.ldFetch = ldFetch;
    this.baseUrl = baseUrl;
    this.config = config;
  }

  private async discover(): Promise<void> {
    await this.ldFetch.get(this.baseUrl).then(async (response) => {
      //the current page needs to be discoverable
      //Option 1: the lc:departureTimeQuery
      // → through a hydra:search → hydra:template
      // Need to check whether this is our building block: hydra:search → hydra:mapping → hydra:property === lc:departureTimeQuery
      //filter once all triples with these predicates
      const metaTriples = this.getMetaTriples(response.triples);
      const searchUriTriples = this.getSearchUriTriples(metaTriples, response.url);

      //look for all search template for the mapping
      for (let i = 0; i < searchUriTriples.length; i ++) {
        const searchUri = searchUriTriples[i].object;
        const template = this.getTemplate(searchUri, metaTriples);

        let params: {departureTime: string} = {departureTime: undefined};
        if (this.config.backward) {
          params.departureTime = this.upperBoundDate.toISOString();
        } else {
          params.departureTime = this.lowerBoundDate.toISOString();
        }

        const url = template.expand(params);
        await this.getPage(url)
      }
    });
  }

  private getMetaTriples(triples: ITriple[]): ITriple[]{
    return triples.filter((triple) => {
      return (
        triple.predicate === "http://www.w3.org/ns/hydra/core#search" ||
        triple.predicate === "http://www.w3.org/ns/hydra/core#mapping" ||
        triple.predicate === "http://www.w3.org/ns/hydra/core#template" ||
        triple.predicate === "http://www.w3.org/ns/hydra/core#property" ||
        triple.predicate === "http://www.w3.org/ns/hydra/core#variable"
      )
    });
  }

  private getSearchUriTriples(triples: ITriple[], searchUri): ITriple[]{
    return triples.filter((triple) =>
      triple.predicate === "http://www.w3.org/ns/hydra/core#search" && triple.subject === searchUri
    );
  }

  private getTemplate(searchUri: string, metaTriples: ITriple[]) {
    //TODO: filter on the right subject
    const template = Util.getLiteralValue(metaTriples.filter((triple) => {
      return triple.subject === searchUri && triple.predicate === "http://www.w3.org/ns/hydra/core#template";
    })[0].object);

    return UriTemplate.parse(template);
  }

  private async getPage(url: string) {
    await this.ldFetch.get(url).then((response) => {
      this.addTriples(response.url, response.triples);
    });
  }

  async read(): Promise<IConnection> {
    if (this.connections === undefined) {
      await this.discover();
    }
    else if (this.connections.length === 0) {
      let iri = this.previousPageIri;
      if (!this.config.backward) {
        iri = this.nextPageIri;
      }
      await this.getPage(iri);
    }
    return this.config.backward ? this.connections.pop() : this.connections.shift();
  }

  setUpperBound(upperBound: Date) {
    this.upperBoundDate = upperBound;
  }

  setLowerBound(lowerBound: Date) {
    this.lowerBoundDate = lowerBound;
  }

  addTriples(documentIri: string, triples: ITriple[]) {
    //Find next page
    //building block 1: every page should be a hydra:PagedCollection with a next and previous page link
    let nextPage = triples.filter((triple) => {
      return triple.predicate === 'http://www.w3.org/ns/hydra/core#next' && triple.subject === documentIri;
    });
    let previousPage = triples.filter((triple) => {
      return triple.predicate === 'http://www.w3.org/ns/hydra/core#previous' && triple.subject === documentIri;
    });
    this.nextPageIri = null;
    this.previousPageIri = null;
    if (nextPage[0] && nextPage[0].object.substr(0,4) === 'http') {
      this.nextPageIri = nextPage[0].object;
    }
    if (previousPage[0] && previousPage[0].object.substr(0,4) === 'http') {
      this.previousPageIri = previousPage[0].object;
    }
    //group all entities together and
    let entities = [];
    for (let i = 0; i < triples.length ; i++) {
      let triple: any = triples[i];

      if (!entities[triple.subject]) {
        entities[triple.subject] = {};
      }
      if (triple.predicate === "http://semweb.mmlab.be/ns/linkedconnections#departureTime") {
        triple.predicate = "departureTime";
        triple.object = new Date(Util.getLiteralValue(triple.object));
      }
      if (triple.predicate === "http://semweb.mmlab.be/ns/linkedconnections#departureDelay") {
        triple.predicate = "departureDelay";
        triple.object = Util.getLiteralValue(triple.object);
      }
      if (triple.predicate === "http://semweb.mmlab.be/ns/linkedconnections#arrivalDelay") {
        triple.predicate = "arrivalDelay";
        triple.object = Util.getLiteralValue(triple.object);
      }
      if (triple.predicate === "http://semweb.mmlab.be/ns/linkedconnections#arrivalTime") {
        triple.predicate = "arrivalTime";
        triple.object = new Date(Util.getLiteralValue(triple.object));
      }
      if (triple.predicate === "http://semweb.mmlab.be/ns/linkedconnections#departureStop") {
        triple.predicate = "departureStop";
      }

      if (triple.predicate === "http://semweb.mmlab.be/ns/linkedconnections#arrivalStop") {
        triple.predicate = "arrivalStop";
      }
      if (triple.predicate === "http://vocab.gtfs.org/terms#trip") {
        triple.predicate = "gtfs:trip";
      }

      entities[triple.subject][triple.predicate] = triple.object;
    }

    //Find all Connections
    //building block 2: every lc:Connection entity is taken from the page and processed
    let keys = Object.keys(entities);
    let connections = [];
    for (let i = 0; i < keys.length; i++) {
      if (entities[keys[i]]["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"] && entities[keys[i]]["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"] === 'http://semweb.mmlab.be/ns/linkedconnections#Connection') {
        entities[keys[i]]["@id"] = keys[i];

        connections.push(entities[keys[i]]);
      }
    }

    this.connections = connections.sort((connectionA, connectionB) => {
      return connectionA.departureTime.valueOf() - connectionB.departureTime.valueOf();
    });
  }

  getNextPageIri(): string {
    return this.nextPageIri;
  }

  getPreviousPageIri(): string {
    return this.previousPageIri;
  }

  getConnections(): IConnection[] {
    return this.connections;
  }
}
