import IConnection from "../../../../../fetcher/connections/IConnection";

/**
 * Interface for the CSA profile for a specific amount of transfers that can be made.
 *
 * @property arrivalTime Describes the arrival time in milliseconds.
 * @property exitConnection Describes the [[IConnection]] that arrives at the target [[IStop]].
 * @property enterConnection Describes the [[IConnection]] that should be taken
 * to arrive at the arrivalTime in the target [[IStop]].
 */
export default interface ITransferProfile {
  arrivalTime: number;
  exitConnection: IConnection;
  enterConnection: IConnection;
}
