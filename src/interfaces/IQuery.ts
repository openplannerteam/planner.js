import ILocation from "./ILocation";
import { DurationMs, SpeedkmH } from "./units";

export default interface IQuery {
  from?: string | string[] | ILocation | ILocation[];
  to?: string | string[] | ILocation | ILocation[];
  minimumDepartureTime?: Date;
  maximumArrivalTime?: Date;
  roadOnly?: boolean;
  publicTransportOnly?: boolean;
  walkingSpeed?: SpeedkmH;
  minimumWalkingSpeed?: SpeedkmH;
  maximumWalkingSpeed?: SpeedkmH;
  maximumTransferDuration?: DurationMs;
  maximumTransfers?: number;
}
