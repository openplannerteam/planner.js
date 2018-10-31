import { injectable } from "inversify";
import LDFetch from "ldfetch";
import { Triple } from "rdf-js";
import { logTripleTable, transformPredicate } from "../helpers";
import IStop from "./IStop";
import IStopsFetcher from "./IStopsFetcher";

const STOPS_URLS = [
  "https://belgium.linkedconnections.org/delijn/Antwerpen/stops",
  "https://belgium.linkedconnections.org/delijn/Oost-Vlaanderen/stops",
  "https://belgium.linkedconnections.org/delijn/West-Vlaanderen/stops",
  "https://belgium.linkedconnections.org/delijn/Vlaams-Brabant/stops",
  "https://belgium.linkedconnections.org/delijn/Limburg/stops",
];

interface IPartialStopMap {
  [stopId: string]: Partial<IStop>;
}

interface IStopMap {
  [stopId: string]: IStop;
}

@injectable()
export default class StopsFetcherDeLijn implements IStopsFetcher {

  public prefix = "https://data.delijn.be/stops/";

  private ldFetch: LDFetch;
  private loadPromise: Promise<any>;
  private stops: IStopMap;

  constructor() {

    this.ldFetch = new LDFetch({ headers: { Accept: "application/ld+json" } });
    this.loadStops();
  }

  public async getStopById(stopId: string): Promise<IStop> {
    if (this.loadPromise) {
      await this.loadPromise;
    }

    return this.stops[stopId];
  }

  private loadStops() {
    this.loadPromise = Promise
      .all(STOPS_URLS.map((url) => this.ldFetch.get(url)))
      .then((responses) => {
        // logTripleTable(response.triples);

        this.stops = responses.reduce((stops, response) => {
          Object.assign(stops, this.parseTriples(response.triples));
          return stops;
        }, {});

        this.loadPromise = null;
      });
  }

  private transformPredicate(triple: Triple): Triple {
    return transformPredicate({
      "http://xmlns.com/foaf/0.1/name": "name",
      "http://www.w3.org/2003/01/geo/wgs84_pos#lat": "latitude",
      "http://www.w3.org/2003/01/geo/wgs84_pos#long": "longitude",
    }, triple);
  }

  private parseTriples(triples: Triple[]): IStopMap {
    return triples.reduce((stopMap: IPartialStopMap, triple: Triple) => {
      triple = this.transformPredicate(triple);

      const { subject: { value: subject }, predicate: { value: predicate }, object: { value: object } } = triple;

      if (!(subject in stopMap)) {
        stopMap[subject] = {
          "@id": subject,
        };
      }

      if (predicate === "longitude" || predicate === "latitude") {
        stopMap[subject][predicate] = parseFloat(object);

      } else {
        stopMap[subject][predicate] = object;
      }

      return stopMap;
    }, {}) as IStopMap;
  }
}
