import IConnection from "../../../../../entities/connections/connections";
import IArrivalTimeByTransfers from "../IArrivalTimeByTransfers";
import IEarliestArrival from "./IEarliestArrival";
import IEarliestArrivalByTransfers from "./IEarliestArrivalByTransfers";
/**
 * A factory that create's an [[IEarliestArrival]] for each amount of maximum transfers that can be made.
 *
 * @implements [[IEarliestArrivalByTransfers]]
 */
export default class EarliestArrivalByTransfers extends Array<IEarliestArrival> implements IEarliestArrivalByTransfers {
    static create(amountOfTransfers: number): EarliestArrivalByTransfers;
    static createByConnection(currentArrivalTimeByTransfers: EarliestArrivalByTransfers, connection: IConnection, arrivalTimeByTransfers: IArrivalTimeByTransfers): EarliestArrivalByTransfers;
    [amountOfTransfers: number]: IEarliestArrival;
    constructor(maximumTransfers: number);
}
