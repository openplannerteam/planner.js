import ILocation from "./ILocation";
import IProbabilisticValue from "./IProbabilisticValue";

export default interface IStep {
  startLocation: ILocation;
  stopLocation: ILocation;
  duration: IProbabilisticValue;
  distance?: number;
}
