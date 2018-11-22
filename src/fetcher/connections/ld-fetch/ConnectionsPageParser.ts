import { Triple } from "rdf-js";
import TravelMode from "../../../TravelMode";
import Units from "../../../util/Units";
import { transformPredicate } from "../../helpers";
import IConnection from "../IConnection";

interface IEntity {
}

interface IEntityMap {
  [subject: string]: IEntity;
}

/**
 * Parses the given array of triples into an array of [[IConnection]]s
 * It first builds up an array of entities, where each item is a 'subject',
 * its properties are 'predicates' and values are 'objects'
 * After, it filters those entities by type, only leaving 'linked connections'.
 */
export default class ConnectionsPageParser {
  private readonly documentIri: string;
  private readonly triples: Triple[];

  constructor(documentIri: string, triples: Triple[]) {
    this.documentIri = documentIri;
    this.triples = triples;
  }

  public getConnections(travelMode: TravelMode): IConnection[] {
    // group all entities together and
    const entities = this.getEntities(this.triples);

    // Find all Connections
    let connections = this.filterConnectionsFromEntities(entities);

    // Add travel mode
    connections = connections.map((connection: IConnection) => {
      connection.travelMode = travelMode;
      return connection;
    });

    // Sort connections by departure time
    return connections.sort((connectionA, connectionB) => {
      return connectionA.departureTime.valueOf() - connectionB.departureTime.valueOf();
    });
  }

  private filterConnectionsFromEntities(entities: IEntityMap): IConnection[] {
    const typePredicate = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

    // building block 2: every lc:Connection entity is taken from the page and processed
    return Object.values(entities)
      .filter((entity: IEntity) =>
        entity[typePredicate] && entity[typePredicate] === "http://semweb.mmlab.be/ns/linkedconnections#Connection",
      ) as IConnection[];
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

      if (triple.predicate.value === "departureDelay" || triple.predicate.value === "arrivalDelay") {
        newObject = Units.fromSeconds(parseInt(triple.object.value, 10));
      }

      if (!entities[subject]) {
        entities[subject] = {
          id: subject,
        };
      }

      entities[subject][predicate] = newObject || object;

      return entities;
    }, {});
  }
}
