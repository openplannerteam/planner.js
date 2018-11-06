import { DurationMs } from "../../interfaces/units";

export default interface IConnection {
  id: string;

  arrivalTime: Date;
  arrivalStop: string;
  arrivalDelay: DurationMs;

  departureTime: Date;
  departureStop: string;
  departureDelay: DurationMs;

  "gtfs:trip": string;
}
