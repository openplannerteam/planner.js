import IConnection from "../../../../fetcher/connections/IConnection";

export default class EarliestArrival {
  public arrivalTime: number = Infinity;
  public connection: IConnection = null;
}
