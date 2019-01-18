import ILocation from "../interfaces/ILocation";
import { DurationMs, SpeedKmH } from "../interfaces/units";

export default interface IResolvedQuery {
  from?: ILocation[];
  to?: ILocation[];
  minimumDepartureTime?: Date;
  maximumArrivalTime?: Date;
  roadOnly?: boolean;
  publicTransportOnly?: boolean;
  minimumWalkingSpeed?: SpeedKmH;
  maximumWalkingSpeed?: SpeedKmH;
  maximumWalkingDuration?: DurationMs;
  minimumTransferDuration?: DurationMs;
  maximumTransferDuration?: DurationMs;
  maximumTransfers?: number;
}
