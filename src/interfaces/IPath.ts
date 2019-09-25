import ILeg from "./ILeg";
import IQuery from "./IQuery";
import { DurationMs } from "./units";

export default interface IPath {
  legs: ILeg[];

  getDepartureTime(query: IQuery): Date;
  getArrivalTime(query: IQuery): Date;
  getTravelTime(): DurationMs;
  getTransferTime(): DurationMs;
}
