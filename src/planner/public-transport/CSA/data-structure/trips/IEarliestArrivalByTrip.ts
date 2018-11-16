import IEarliestArrivalByTransfers from "./IEarliestArrivalByTransfers";

export default interface IEarliestArrivalByTrip {
  [trip: string]: IEarliestArrivalByTransfers;
}
