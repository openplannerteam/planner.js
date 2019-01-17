import TravelMode from "./enums/TravelMode";

export default class Catalog {

  public static combine(...catalogs: Catalog[]): Catalog {
    const combinedCatalog = new Catalog();

    for (const sourceCatalog of catalogs) {
      combinedCatalog.stopsSourceConfigs.push(...sourceCatalog.stopsSourceConfigs);
      combinedCatalog.connectionsSourceConfigs.push(...sourceCatalog.connectionsSourceConfigs);
    }

    return combinedCatalog;
  }

  public stopsSourceConfigs: IStopsSourceConfig[] = [];
  public connectionsSourceConfigs: IConnectionsSourceConfig[] = [];

  public addStopsSource(accessUrl: string) {
    this.stopsSourceConfigs.push({accessUrl});
  }

  public addConnectionsSource(accessUrl: string, travelMode: TravelMode) {
    this.connectionsSourceConfigs.push({accessUrl, travelMode});
  }
}

export interface IStopsSourceConfig {
  accessUrl: string;
}

export interface IConnectionsSourceConfig {
  accessUrl: string;
  travelMode: TravelMode;
}
