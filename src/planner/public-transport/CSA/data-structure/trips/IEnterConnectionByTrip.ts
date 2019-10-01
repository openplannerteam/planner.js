import IConnection from "../../../../../entities/connections/connections";

/**
 * @property arrivalTime Describes the earliest arrival time in milliseconds to the target [[IStop]].
 * @property connection Describes the [[IConnection]] that should be taken to arrive
 * at the arrivalTime in the target location.
 */
export default interface IEnterConnectionByTrip {
  [trip: string]: IConnection;
}
