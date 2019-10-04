/**
 * Stores for each tripId the earliest arrival [[IEarliestArrivalByTransfers]] to the target [[IStop]].
 */
import IEarliestArrivalByTransfers from "./IEarliestArrivalByTransfers";

export default interface IEarliestArrivalByTrip {
  [trip: string]: IEarliestArrivalByTransfers;
}
