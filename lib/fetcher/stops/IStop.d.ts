import { DurationMs } from "../../interfaces/units";
/**
 * Interface for a Stop. This describes an actual physical stop, e.g. a train or a bus stop
 * @property id An identifier for the stop that gets used in IConnections
 * @property name Display name of the stop
 */
export default interface IStop {
    id: string;
    name: string;
    longitude: number;
    latitude: number;
    avgStopTimes?: DurationMs;
}
