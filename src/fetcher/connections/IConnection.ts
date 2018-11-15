import { DurationMs } from "../../interfaces/units";
import TravelMode from "../../TravelMode";

export default interface IConnection {
  id: string;
  travelMode: TravelMode;

  arrivalTime: Date;
  arrivalStop: string;
  arrivalDelay: DurationMs;

  departureTime: Date;
  departureStop: string;
  departureDelay: DurationMs;

  gtfsTripId: string;
}
