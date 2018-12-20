import TravelMode from "./TravelMode";

export default class Catalog {
  public stopsFetcherConfigs = [];
  public connectionsFetcherConfigs = [];

  public addStopsFetcher(accessUrl: string) {
    this.stopsFetcherConfigs.push({accessUrl});
  }

  public addConnectionsFetcher(accessUrl: string, travelMode: TravelMode) {
    this.connectionsFetcherConfigs.push({accessUrl, travelMode});
  }
}
