/**
 * Stores an arrival time in milliseconds for the maximum amount of transfers that can be made.
 */
export default interface IArrivalTimeByTransfers extends Array<number> {
  [amountOfTransfers: number]: number;
}
