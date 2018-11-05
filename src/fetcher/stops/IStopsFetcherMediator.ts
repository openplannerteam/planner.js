import IStop from "./IStop";

export default interface IStopsFetcherMediator {
  getStopById: (stopId: string) => Promise<IStop>;
  getAllStops: () => Promise<IStop[]>;
}
