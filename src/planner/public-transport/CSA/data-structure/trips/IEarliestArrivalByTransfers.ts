import IEarliestArrival from "./IEarliestArrival";

/**
 * Stores the earliest arrival [[IEarliestArrival]] for a maximum amount of transfers.
 */
export default interface IEarliestArrivalByTransfers extends Array<IEarliestArrival> {
  [amountOfTransfers: number]: IEarliestArrival;
}
