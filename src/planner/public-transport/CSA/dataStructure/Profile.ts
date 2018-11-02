import IConnection from "../../../../fetcher/connections/IConnection";

export default class Profile {
  public departureTime: number;
  public arrivalTimes: number[];
  public enterConnections: IConnection[];
  public exitConnections: IConnection[];

  constructor(maxLegs: number) {
    this.departureTime = Infinity;
    this.arrivalTimes = Array(maxLegs).fill(Infinity);
    this.enterConnections = Array(maxLegs).fill(undefined);
    this.exitConnections = Array(maxLegs).fill(undefined);
  }
}
