import LdFetch from "ldfetch";
import { Util } from "n3";
import { Triple } from "rdf-js";
import UriTemplate from "uritemplate";
import { matchesTriple, transformPredicate } from "../../helpers";
import IConnection from "../IConnection";

interface IEntity {
}

interface IEntityMap {
  [subject: string]: IEntity;
}

export default class ConnectionsIteratorLDFetch implements AsyncIterator<IConnection> {
  public readonly baseUrl: string;
  private ldFetch: LdFetch;

  private connections: IConnection[];
  private upperBoundDate: Date = new Date();
  private lowerBoundDate: Date = new Date();
  private config: { backward: boolean };

  private previousPageIri: string;
  private nextPageIri: string;

  constructor(baseUrl: string, ldFetch: LdFetch, config: { backward: boolean } = { backward: true }) {
    this.baseUrl = baseUrl;
    this.ldFetch = ldFetch;
    this.config = config;
  }

  public setUpperBound(upperBound: Date) {
    this.upperBoundDate = upperBound;
  }

  public setLowerBound(lowerBound: Date) {
    this.lowerBoundDate = lowerBound;
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

  public async next(): Promise<IteratorResult<IConnection>> {
    if (!this.connections) {
      await this.discover();

    } else if (this.connections.length === 0) {
      const pageIri = this.config.backward ?
        this.previousPageIri : this.nextPageIri;

      console.log("Next page:", pageIri);

      await this.loadPage(pageIri);
    }

    const value = this.config.backward ?
      this.connections.pop() :
      this.connections.shift();

    return { value, done: false };

  }

  public return(): Promise<IteratorResult<IConnection>> {
    return undefined;
  }

  public throw(e?: any): Promise<IteratorResult<IConnection>> {
    return undefined;
  }

  private filterConnectionsFromEntities(entities: IEntityMap): IConnection[] {
    const typePredicate = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

    // building block 2: every lc:Connection entity is taken from the page and processed
    return Object.values(entities)
      .filter((entity: IEntity) =>
        entity[typePredicate] && entity[typePredicate] === "http://semweb.mmlab.be/ns/linkedconnections#Connection",
      ) as IConnection[];
  }

  private addTriples(documentIri: string, triples: Triple[]) {

    // Find next page
    this.setHydraLinks(triples, documentIri);

    // group all entities together and
    const entities = this.getEntities(triples);

    // Find all Connections
    const connections = this.filterConnectionsFromEntities(entities);

    // Sort connections by departure time
    this.connections = connections.sort((connectionA, connectionB) => {
      return connectionA.departureTime.valueOf() - connectionB.departureTime.valueOf();
    });
  }

  private transformPredicate(triple: Triple): Triple {
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
      triple = this.transformPredicate(triple);

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
    await this.ldFetch.get(this.baseUrl)
      .then(async (response) => {

        const metaTriples = this.getHydraTriples(response.triples);
        const searchTemplate = this.getHydraSearchTemplate(metaTriples, response.url);

        const departureTimeDate = this.config.backward ?
          this.upperBoundDate : this.lowerBoundDate;

        const firstPageIri = searchTemplate.expand({
          departureTime: departureTimeDate.toISOString(),
        });

        console.log("First page: ", firstPageIri);

        await this.loadPage(firstPageIri);
      });
  }

  private getHydraTriples(triples: Triple[]): Triple[] {
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

  private getHydraSearchTemplate(hydraTriples: Triple[], searchUri): UriTemplate {
    const searchTriple = hydraTriples.find(
      matchesTriple(searchUri, "http://www.w3.org/ns/hydra/core#search", null),
    );

    const templateTriple = hydraTriples.find(
      matchesTriple(searchTriple.object.value, "http://www.w3.org/ns/hydra/core#template", null),
    );

    const template = templateTriple.object.value;
    return UriTemplate.parse(template);

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

  private async loadPage(url: string) {
    await this.ldFetch.get(url)
      .then((response) => {
        this.addTriples(response.url, response.triples);
      });
  }
}
