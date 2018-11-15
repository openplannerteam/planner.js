import TravelMode from "../TravelMode";
import ILocation from "./ILocation";
import IProbabilisticValue from "./IProbabilisticValue";
import { DistanceM, DurationMs } from "./units";

export default interface IStep {
  startLocation: ILocation;
  stopLocation: ILocation;
  travelMode: TravelMode;
  startTime?: Date;
  stopTime?: Date;
  duration: IProbabilisticValue<DurationMs>;
  distance?: DistanceM;
}
