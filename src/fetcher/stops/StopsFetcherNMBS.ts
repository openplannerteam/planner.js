import IStopsFetcher from "./IStopsFetcher";
import IStop from "./IStop";
import { injectable } from "inversify";

const IRAIL_STATIONS_URL = "https://api.irail.be/stations/?format=json";

interface StopMap {
  [stopId: string]: IStop
}

@injectable()
export default class StopsFetcherNMBS implements IStopsFetcher {
  private _loadPromise: Promise<any>;
  private stops: StopMap;

  constructor() {
    this.loadStops();
  }

  loadStops() {
    this._loadPromise = fetch(IRAIL_STATIONS_URL)
      .then((response: Response) => response.json())
      .then(({station: stations}) => {
        this.stops = stations.reduce((accu: StopMap, stop: IStop) => {
          accu[stop["@id"]] = stop;
          return stop;
        }, {});

        console.log('Loaded stations');
        this._loadPromise = null;
      });
  }

  async getStopById(stopId: string) {
    if(this._loadPromise) {
      await this._loadPromise;
    }

    return new Promise<IStop>((resolve, reject) => {
      resolve({ "@id": "hey", name: "Kortrijk", locationX: 0, locationY: 52 });
    });
  }
};

