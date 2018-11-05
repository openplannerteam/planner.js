import IConnection from "../../../../fetcher/connections/IConnection";
import IArrivalTimeByTransfers from "./IArrivalTimeByTransfers";

export default class Profile {
  public departureTime: number;
  public arrivalTimes: IArrivalTimeByTransfers;
  public enterConnections: IConnection[];
  public exitConnections: IConnection[];

  constructor(maxLegs: number) {
    this.departureTime = Infinity;
    this.arrivalTimes = Array(maxLegs).fill(Infinity);
    this.enterConnections = Array(maxLegs).fill(undefined);
    this.exitConnections = Array(maxLegs).fill(undefined);
  }
}
