import IStop from "../../fetcher/stops/IStop";
import { DurationMs, SpeedkmH } from "../../interfaces/units";

export default interface IReachableStopsFinder {
  findReachableStops: (
    sourceStop: IStop,
    maximumDuration: DurationMs,
    minimumSpeed: SpeedkmH,
  ) => Promise<IReachableStop[]>;
}

export interface IReachableStop {
  stop: IStop;
  duration: DurationMs;
}
