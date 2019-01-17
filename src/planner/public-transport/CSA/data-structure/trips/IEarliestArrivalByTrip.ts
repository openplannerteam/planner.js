/**
 * Stores for each gtfs:trip the earliest arrival [[IEarliestArrivalByTransfers]] to the target [[IStop]].
 */
export default interface IEarliestArrivalByTrip<T> {
  [trip: string]: T;
}
