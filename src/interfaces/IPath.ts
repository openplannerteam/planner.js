import ILeg from "./ILeg";
import IQuery from "./IQuery";
import { DurationMs } from "./units";

export default interface IPath {
  legs: ILeg[];

  addToContext(id: string, value: any);
  getFromContext(id: string): any;

  getDepartureTime(query: IQuery): Date;
  getArrivalTime(query: IQuery): Date;
  getTravelTime(query: IQuery): DurationMs;
  getTransferTime(query: IQuery): DurationMs;
}
