import IConnection from "../../../../../fetcher/connections/IConnection";

export default interface IEarliestArrival {
  arrivalTime: number;
  connection: IConnection;
}
