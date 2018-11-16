import IConnection from "../../../../../fetcher/connections/IConnection";

export default interface ITransferProfile {
  exitConnection: IConnection;
  enterConnection: IConnection;
  arrivalTime: number;
}
