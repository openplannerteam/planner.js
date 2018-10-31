import ILocation from "./ILocation";

export default interface IQuery {
  from?: string | string[] | ILocation | ILocation[];
  to?: string | string[] | ILocation | ILocation[];
  minimumDepartureTime?: Date;
  maximumArrivalTime?: Date;
  roadOnly?: boolean;
  publicTransportOnly?: boolean;
}
