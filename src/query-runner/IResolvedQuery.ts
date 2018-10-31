import ILocation from "../interfaces/ILocation";

export default interface IResolvedQuery {
  from?: ILocation[];
  to?: ILocation[];
  minimumDepartureTime?: Date;
  maximumArrivalTime?: Date;
  roadOnly?: boolean;
  publicTransportOnly?: boolean;
  minimumWalkingSpeed?: number;
  maximumWalkingSpeed?: number;
}
