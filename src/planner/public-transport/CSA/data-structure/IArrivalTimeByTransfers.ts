/**
 * Stores an arrival time in milliseconds and the corresponding trip ID
 * for a maximum amount of transfers that can be made.
 */
export default interface IArrivalTimeByTransfers extends Array<{arrivalTime: number, tripId?: string}> {
  [amountOfTransfers: number]: {
    arrivalTime: number,
    tripId?: string,
  };
}
