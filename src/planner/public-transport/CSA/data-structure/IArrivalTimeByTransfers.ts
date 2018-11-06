export default interface IArrivalTimeByTransfers extends Array<number> {
  [amountOfTransfers: number]: number;
}
