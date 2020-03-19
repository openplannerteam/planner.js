import TravelMode from "../enums/TravelMode";
import ILocation from "./ILocation";
import { DistanceM, DurationMs, SpeedKmH } from "./units";

export default interface IQuery {
  from?: string | string[] | ILocation | ILocation[];
  to?: string | string[] | ILocation | ILocation[];
  profileID?: string;
  minimumDepartureTime?: Date;
  maximumArrivalTime?: Date;
  roadOnly?: boolean;
  roadNetworkOnly?: boolean;
  walkingSpeed?: SpeedKmH;
  minimumWalkingSpeed?: SpeedKmH;
  maximumWalkingSpeed?: SpeedKmH;
  maximumWalkingDuration?: DurationMs;
  maximumWalkingDistance?: DistanceM;
  minimumTransferDuration?: DurationMs;
  maximumTransferDuration?: DurationMs;
  maximumTransferDistance?: DistanceM;
  maximumTransfers?: number;
  maximumTravelDuration?: DurationMs;
  excludedTravelModes?: TravelMode[];
  minimized?: boolean; // contain all details, or only start/stop locations?
}
