import { Triple } from "rdf-js";
import TravelMode from "../../../TravelMode";
import Rdf from "../../../util/Rdf";
import Units from "../../../util/Units";
import DropOffType from "../DropOffType";
import IConnection from "../IConnection";
import PickupType from "../PickupType";

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
    return Rdf.transformPredicate({
      "http://semweb.mmlab.be/ns/linkedconnections#departureTime": "departureTime",
      "http://semweb.mmlab.be/ns/linkedconnections#departureDelay": "departureDelay",
      "http://semweb.mmlab.be/ns/linkedconnections#arrivalDelay": "arrivalDelay",
      "http://semweb.mmlab.be/ns/linkedconnections#arrivalTime": "arrivalTime",
      "http://semweb.mmlab.be/ns/linkedconnections#departureStop": "departureStop",
      "http://semweb.mmlab.be/ns/linkedconnections#arrivalStop": "arrivalStop",
      "http://semweb.mmlab.be/ns/linkedconnections#nextConnection": "nextConnection",

      "http://vocab.gtfs.org/terms#route": "gtfs:route",
      "http://vocab.gtfs.org/terms#trip": "gtfs:trip",
      "http://vocab.gtfs.org/terms#dropOffType": "gtfs:dropOffType",
      "http://vocab.gtfs.org/terms#pickupType": "gtfs:pickupType",
      "http://vocab.gtfs.org/terms#headsign": "gtfs:headsign",
    }, triple);
  }

  private transformObject(triple: Triple): Triple {

    if (triple.predicate.value === "gtfs:dropOffType") {
      return Rdf.transformObject({
        "http://vocab.gtfs.org/terms#Regular": DropOffType.Regular,
        "http://vocab.gtfs.org/terms#NotAvailable": DropOffType.NotAvailable,
        "http://vocab.gtfs.org/terms#MustPhone": DropOffType.MustPhone,
        "http://vocab.gtfs.org/terms#MustCoordinateWithDriver": DropOffType.MustCoordinateWithDriver,
      }, triple);
    }

    if (triple.predicate.value === "gtfs:pickupType") {
      return Rdf.transformObject({
        "http://vocab.gtfs.org/terms#Regular": PickupType.Regular,
        "http://vocab.gtfs.org/terms#NotAvailable": PickupType.NotAvailable,
        "http://vocab.gtfs.org/terms#MustPhone": PickupType.MustPhone,
        "http://vocab.gtfs.org/terms#MustCoordinateWithDriver": PickupType.MustCoordinateWithDriver,
      }, triple);
    }

    return triple;
  }

  private getEntities(triples: Triple[]): IEntityMap {

    return triples.reduce((entities: IEntityMap, triple: Triple) => {
      triple = this.transformObject(this.transformPredicate(triple));

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

      // nextConnection should be an array
      // todo: test once nextConnection becomes available
      if (predicate === "nextConnection") {
        entities[subject][predicate] = entities[subject][predicate] || [];
        entities[subject][predicate].push(object);

      } else {
        entities[subject][predicate] = newObject || object;
      }

      return entities;
    }, {});
  }
}
