import IEarliestArrivalByTransfers from "./IEarliestArrivalByTransfers";

/**
 * Stores for each gtfs:trip the earliest arrival [[IEarliestArrivalByTransfers]] to the target [[IStop]].
 */
export default interface IEarliestArrivalByTrip {
  [trip: string]: IEarliestArrivalByTransfers;
}
