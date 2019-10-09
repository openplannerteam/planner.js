import TravelMode from "../enums/TravelMode";
import ILocation from "../interfaces/ILocation";
import { DurationMs, SpeedKmH } from "../interfaces/units";

/**
 * A resolved query is the result of transforming an input [[IQuery]] by adding defaults for any missing parameters and
 * by resolving the endpoints (`from` and `to`). Classes using this resolved query don't have to worry about any missing
 * or unrealistic parameters
 */
export default interface IResolvedQuery {
  from?: ILocation[];
  to?: ILocation[];
  profileID: string;
  minimumDepartureTime?: Date;
  maximumArrivalTime?: Date;
  roadOnly?: boolean;
  roadNetworkOnly?: boolean;
  minimumWalkingSpeed?: SpeedKmH;
  maximumWalkingSpeed?: SpeedKmH;
  maximumWalkingDuration?: DurationMs;
  minimumTransferDuration?: DurationMs;
  maximumTransferDuration?: DurationMs;
  maximumTransfers?: number;
  maximumTravelDuration?: DurationMs;
  excludedTravelModes?: Set<TravelMode>;
}
