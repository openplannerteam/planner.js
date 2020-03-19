import ILocation from "./ILocation";
import IProbabilisticValue from "./IProbabilisticValue";
import { DistanceM, DurationMs } from "./units";

export default interface IStep {
  startLocation: ILocation;
  stopLocation: ILocation;
  through?: string;
  startTime?: Date;
  stopTime?: Date;
  duration: IProbabilisticValue<DurationMs>;
  distance?: DistanceM;
  enterConnectionId?: string;
  exitConnectionId?: string;
}
