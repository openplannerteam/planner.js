import IEarliestArrival from "./IEarliestArrival";

export default interface IEarliestArrivalByTransfers extends Array<IEarliestArrival> {
  [amountOfTransfers: number]: IEarliestArrival;
}
