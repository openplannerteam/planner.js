import IConnection from "../../../../entities/connections/connections";
import { DurationMs } from "../../../../interfaces/units";
import IArrivalTimeByTransfers from "../data-structure/IArrivalTimeByTransfers";
import IProfilesByStop from "../data-structure/stops/IProfilesByStop";
/**
 * Utility functions that can be used on the CSA profiles [[IProfilesByStop]].
 */
export default class ProfileUtil {
    static filterInfinity(profilesByStop: IProfilesByStop): IProfilesByStop;
    static getTransferTimes(profilesByStop: IProfilesByStop, connection: IConnection, maxLegs: number, minimumTransferDuration: DurationMs, maximumTransferDuration: DurationMs): IArrivalTimeByTransfers;
}
