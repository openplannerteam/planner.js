export default class Catalog {
  public stopsFetcherConfigs = [];

  public addStopsFetcher(prefix, accessUrl) {
    this.stopsFetcherConfigs.push({prefix, accessUrl});
  }
}
