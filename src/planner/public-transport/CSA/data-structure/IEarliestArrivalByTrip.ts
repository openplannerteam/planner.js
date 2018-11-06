import EarliestArrival from "./EarliestArrival";

export default interface IEarliestArrivalByTrip {
  [trip: string]: EarliestArrival[];
}
