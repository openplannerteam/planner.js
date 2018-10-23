import { BufferedIterator } from "asynciterator";
import LdFetch from "ldfetch";
import { Util } from "n3";
import { Triple } from "rdf-js";
import UriTemplate from "uritemplate";
import { matchesTriple, transformPredicate } from "../../helpers";
import IConnection from "../IConnection";

interface IEntity {
  [predicate: string]: string | Date;
}

interface IEntityMap {
  [subject: string]: IEntity;
}

export default class ConnectionsIteratorLDFetch extends BufferedIterator<IConnection> {
  public readonly baseUrl: string;
  private ldFetch: LdFetch;

  private connections: IConnection[];
  private upperBoundDate: Date = new Date();
  private lowerBoundDate: Date = new Date();
  private config: { backward: boolean };

  private previousPageIri: string;
  private nextPageIri: string;

  constructor(baseUrl: string, ldFetch: LdFetch, config: { backward: boolean } = { backward: true }) {
    super();

    this.baseUrl = baseUrl;
    this.ldFetch = ldFetch;
    this.config = config;
  }

  public async read(): Promise<IConnection> {

    if (this.connections === undefined) {
      await this.discover();

    } else if (this.connections.length === 0) {

      let iri = this.previousPageIri;
      if (!this.config.backward) {
        iri = this.nextPageIri;
      }

      await this.getPage(iri);
    }

    return this.config.backward ?
      this.connections.pop() :
      this.connections.shift();
  }

  public setUpperBound(upperBound: Date) {
    this.upperBoundDate = upperBound;
  }

  public setLowerBound(lowerBound: Date) {
    this.lowerBoundDate = lowerBound;
  }

  public addTriples(documentIri: string, triples: Triple[]) {

    // Find next page
    this.setHydraLinks(triples, documentIri);

    // group all entities together and
    const entities = this.getEntities(triples);

    // Find all Connections
    const connections = this.filterConnectionsFromEntities(entities);

    this.connections = connections.sort((connectionA, connectionB) => {
      return connectionA.departureTime.valueOf() - connectionB.departureTime.valueOf();
    });
  }

  public getNextPageIri(): string {
    return this.nextPageIri;
  }

  public getPreviousPageIri(): string {
    return this.previousPageIri;
  }

  public getConnections(): IConnection[] {
    return this.connections;
  }

  public filterConnectionsFromEntities(entities: IEntityMap): IConnection[] {
    const typePredicate = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

    // building block 2: every lc:Connection entity is taken from the page and processed
    return Object.values(entities)
      .filter((entity: IEntity) =>
        entity[typePredicate] && entity[typePredicate] === "http://semweb.mmlab.be/ns/linkedconnections#Connection",
      );
  }
  private setHydraLinks(triples: Triple[], documentIri: string): void {

    // building block 1: every page should be a hydra:PagedCollection with a next and previous page link
    const nextPageTriple: Triple = triples.find(
      matchesTriple(documentIri, "http://www.w3.org/ns/hydra/core#next", null),
    );
    const previousPageTriple: Triple = triples.find(
      matchesTriple(documentIri, "http://www.w3.org/ns/hydra/core#previous", null),
    );

    this.nextPageIri = null;
    this.previousPageIri = null;

    if (nextPageTriple && nextPageTriple.object.value.substr(0, 4) === "http") {
      this.nextPageIri = nextPageTriple.object.value;
    }

    if (previousPageTriple && previousPageTriple.object.value.substr(0, 4) === "http") {
      this.previousPageIri = previousPageTriple.object.value;
    }
  }

  private transformPredicates(triple: Triple): Triple {
    return transformPredicate({
      "http://semweb.mmlab.be/ns/linkedconnections#departureTime": "departureTime",
      "http://semweb.mmlab.be/ns/linkedconnections#departureDelay": "departureDelay",
      "http://semweb.mmlab.be/ns/linkedconnections#arrivalDelay": "arrivalDelay",
      "http://semweb.mmlab.be/ns/linkedconnections#arrivalTime": "arrivalTime",
      "http://semweb.mmlab.be/ns/linkedconnections#departureStop": "departureStop",
      "http://semweb.mmlab.be/ns/linkedconnections#arrivalStop": "arrivalStop",
      "http://vocab.gtfs.org/terms#trip": "gtfs:trip",
    }, triple);
  }

  private getEntities(triples: Triple[]): IEntityMap {

    return triples.reduce((entities: IEntityMap, triple: Triple) => {
      triple = this.transformPredicates(triple);

      const { subject: { value: subject }, predicate: { value: predicate }, object: { value: object } } = triple;
      let newObject;

      if (triple.predicate.value === "departureTime" || triple.predicate.value === "arrivalTime") {
        newObject = new Date(triple.object.value);
      }

      if (!entities[subject]) {
        entities[subject] = {
          ["@id"]: subject,
        };
      }

      entities[subject][predicate] = newObject || object;

      return entities;
    }, {});
  }

  private async discover(): Promise<void> {
    await this.ldFetch.get(this.baseUrl).then(async (response) => {
      // the current page needs to be discoverable
      // Option 1: the lc:departureTimeQuery
      // → through a hydra:search → hydra:template
      // Need to check whether this is our building block: hydra:search → hydra:mapping → hydra:property === lc:departureTimeQuery
      // filter once all triples with these predicates
      const metaTriples = this.getMetaTriples(response.triples);
      const searchUriTriples = this.getSearchUriTriples(metaTriples, response.url);

      // look for all search template for the mapping
      for (let i = 0; i < searchUriTriples.length; i++) {
        const searchUri = searchUriTriples[i].object.value;
        const template = this.getTemplate(searchUri, metaTriples);

        const params: { departureTime: string } = { departureTime: undefined };
        if (this.config.backward) {
          params.departureTime = this.upperBoundDate.toISOString();
        } else {
          params.departureTime = this.lowerBoundDate.toISOString();
        }

        const url = template.expand(params);
        await this.getPage(url);
      }
    });
  }

  private getMetaTriples(triples: Triple[]): Triple[] {
    return triples.filter((triple) => {
      return (
        triple.predicate.value === "http://www.w3.org/ns/hydra/core#search" ||
        triple.predicate.value === "http://www.w3.org/ns/hydra/core#mapping" ||
        triple.predicate.value === "http://www.w3.org/ns/hydra/core#template" ||
        triple.predicate.value === "http://www.w3.org/ns/hydra/core#property" ||
        triple.predicate.value === "http://www.w3.org/ns/hydra/core#variable"
      );
    });
  }

  private getSearchUriTriples(triples: Triple[], searchUri): Triple[] {
    return triples.filter((triple) =>
      triple.predicate.value === "http://www.w3.org/ns/hydra/core#search" && triple.subject.value === searchUri,
    );
  }

  private getTemplate(searchUri: string, metaTriples: Triple[]) {
    // TODO: filter on the right subject
    const template = Util.getLiteralValue(metaTriples.filter((triple) => {
      return triple.subject.value === searchUri && triple.predicate.value === "http://www.w3.org/ns/hydra/core#template";
    })[0].object);

    return UriTemplate.parse(template);
  }

  private async getPage(url: string) {
    await this.ldFetch.get(url).then((response) => {
      this.addTriples(response.url, response.triples);
    });
  }
}
