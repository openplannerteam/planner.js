import IStop from "./IStop";

export default interface IStopsFetcher {
  getStopById: (stopId: string | string[]) => Promise<IStop>;
}
