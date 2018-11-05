import ILocation from "./ILocation";
import IProbabilisticValue from "./IProbabilisticValue";

export default interface IStep {
  startLocation: ILocation;
  stopLocation: ILocation;
  startTime?: Date;
  stopTime?: Date;
  duration: IProbabilisticValue;
  distance?: number;
}
