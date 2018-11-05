import IStop from "../../fetcher/stops/IStop";

export default interface IReachableStopsFinder {
  findReachableStops: (sourceStop: IStop, maximumDuration: number, minimumSpeed: number) => Promise<IReachableStop[]>;
}

export type IReachableStop = [IStop, number];
