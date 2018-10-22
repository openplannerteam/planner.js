export default interface IQuery {
  from?: string | string[];
  to?: string | string[];
  minimumDepartureTime?: Date;
  maximumArrivalTime?: Date;
  roadOnly?: boolean;
  publicTransportOnly?: boolean;
}
