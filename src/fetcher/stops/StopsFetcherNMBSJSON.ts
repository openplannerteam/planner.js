import { injectable } from "inversify";
import IStop from "./IStop";
import IStopsFetcher from "./IStopsFetcher";

const IRAIL_STATIONS_URL = "https://api.irail.be/stations/?format=json";

interface IStopMap {
  [stopId: string]: IStop;
}

@injectable()
export default class StopsFetcherNMBSJSON implements IStopsFetcher {

  public prefix = "http://irail.be/stations/NMBS/";

  private loadPromise: Promise<any>;
  private stops: IStopMap;

  constructor() {
    this.loadStops();
  }

  public async getStopById(stopId: string): Promise<IStop> {
    if (this.loadPromise) {
      await this.loadPromise;
    }

    return this.stops[stopId];
  }

  private loadStops() {
    this.loadPromise = fetch(IRAIL_STATIONS_URL)
      .then((response: Response) => response.json())
      .then(({station: stations}) => {

        this.stops = stations.reduce((accu: IStopMap, stop) => {
          stop.latitude = stop.locationY;
          stop.longitude = stop.locationX;
          accu[stop["@id"]] = stop as IStop;
          return accu;
        }, {});

        this.loadPromise = null;
      });
  }
}
