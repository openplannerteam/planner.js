import IStop from "./IStop";

export default interface IStopsFetcher {
  getStopById: (stopId: string) => Promise<IStop>
}
