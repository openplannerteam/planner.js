import ILocation from "../interfaces/ILocation";
import { SpeedkmH } from "../interfaces/units";

export default interface IResolvedQuery {
  from?: ILocation[];
  to?: ILocation[];
  minimumDepartureTime?: Date;
  maximumArrivalTime?: Date;
  roadOnly?: boolean;
  publicTransportOnly?: boolean;
  minimumWalkingSpeed?: SpeedkmH;
  maximumWalkingSpeed?: SpeedkmH;
}
