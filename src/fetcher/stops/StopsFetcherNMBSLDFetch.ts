import { injectable } from "inversify";
import LDFetch from "ldfetch";
import { Triple } from "rdf-js";
import { logTripleTable, transformPredicate } from "../helpers";
import IStop from "./IStop";
import IStopsFetcher from "./IStopsFetcher";

const IRAIL_STATIONS_URL = "https://irail.be/stations/NMBS";

interface IPartialStopMap {
  [stopId: string]: Partial<IStop>;
}

interface IStopMap {
  [stopId: string]: IStop;
}

@injectable()
export default class StopsFetcherNMBSLDFetch implements IStopsFetcher {
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

    if (this.stops) {
      return this.stops[stopId];
    }

    return { "name": "Ergens", "@id": "id", "longitude": 5, "latitude": 5 };
  }

  private loadStops() {
    this.loadPromise = this.ldFetch.get(IRAIL_STATIONS_URL)
      .then((response) => {
        // logTripleTable(response.triples);

        this.stops = this.parseTriples(response.triples);
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

      stopMap[subject][predicate] = object;

      return stopMap;
    }, {}) as IStopMap;
  }
}
