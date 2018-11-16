import { DurationMs } from "../../interfaces/units";
import TravelMode from "../../TravelMode";
import DropOffType from "./DropOffType";
import PickupType from "./PickupType";

/**
 * Interface for a Connection. This describes an actual transport vehicle going from its
 * departureStop to its arrivalStop at a certain departureTime, arriving at the arrivalTime.
 * The arrivalTime and departureTime already include the delay and are the actual real-time values
 * for the actual arrival and departureTime.
 * The arrivalDelay and departureDelay then again contain the duration in which these times deviate
 * from the planned time.
 * @property "gtfs:trip" (optional) an identifier for the trip this vehicle is making with this connection
 * @property nextConnection (optional) an identifier for the next connection the vehicle is going to make
 * @property TravelMode The type of vehicle that is used, chosen from an enum [[TravelMode]]
 * Currently missing properties: gtfs:dropOffType and gtfs:pickupType
 */
export default interface IConnection {
  id: string;
  travelMode: TravelMode;

  arrivalTime: Date;
  arrivalStop: string;
  arrivalDelay?: DurationMs;

  departureTime: Date;
  departureStop: string;
  departureDelay?: DurationMs;

  "gtfs:route"?: string;
  "gtfs:trip"?: string;
  "gtfs:dropOffType"?: DropOffType;
  "gtfs:pickupType"?: PickupType;
  "gtfs:headsign"?: string;
  nextConnection?: string;
}
