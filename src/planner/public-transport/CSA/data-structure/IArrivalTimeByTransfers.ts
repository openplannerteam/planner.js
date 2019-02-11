/**
 * Stores an arrival time in milliseconds and the corresponding gtfs:trip
 * for a maximum amount of transfers that can be made.
 */
export default interface IArrivalTimeByTransfers extends Array<{arrivalTime: number, "gtfs:trip"?: string}> {
  [amountOfTransfers: number]: {
    arrivalTime: number,
    "gtfs:trip"?: string,
  };
}
