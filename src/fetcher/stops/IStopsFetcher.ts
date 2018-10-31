import IStop from "./IStop";

export default interface IStopsFetcher {
  prefix: string;
  getStopById: (stopId: string | string[]) => Promise<IStop>;
}
