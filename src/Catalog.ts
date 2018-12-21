import TravelMode from "./TravelMode";

export default class Catalog {

  public static combine(...catalogs: Catalog[]): Catalog {
    const combinedCatalog = new Catalog();

    for (const sourceCatalog of catalogs) {
      combinedCatalog.stopsFetcherConfigs.push(...sourceCatalog.stopsFetcherConfigs);
      combinedCatalog.connectionsFetcherConfigs.push(...sourceCatalog.connectionsFetcherConfigs);
    }

    return combinedCatalog;
  }

  public stopsFetcherConfigs = [];
  public connectionsFetcherConfigs = [];

  public addStopsFetcher(accessUrl: string) {
    this.stopsFetcherConfigs.push({accessUrl});
  }

  public addConnectionsFetcher(accessUrl: string, travelMode: TravelMode) {
    this.connectionsFetcherConfigs.push({accessUrl, travelMode});
  }
}
