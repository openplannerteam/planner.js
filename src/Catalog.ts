import TravelMode from "./TravelMode";

export default class Catalog {
  public stopsFetcherConfigs = [];
  public connectionsFetcherConfigs = [];

  public addStopsFetcher(prefix: string, accessUrl: string) {
    this.stopsFetcherConfigs.push({prefix, accessUrl});
  }

  public addConnectionsFetcher(accessUrl: string, travelMode: TravelMode) {
    this.connectionsFetcherConfigs.push({accessUrl, travelMode});
  }
}
