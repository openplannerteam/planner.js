"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A factory that create's an [[IEarliestArrival]] for each amount of maximum transfers that can be made.
 *
 * @implements [[IEarliestArrivalByTransfers]]
 */
class EarliestArrivalByTransfers extends Array {
    static create(amountOfTransfers) {
        return new EarliestArrivalByTransfers(amountOfTransfers);
    }
    static createByConnection(currentArrivalTimeByTransfers, connection, arrivalTimeByTransfers) {
        return currentArrivalTimeByTransfers.map((earliestArrival, transfer) => {
            if (arrivalTimeByTransfers[transfer].arrivalTime < earliestArrival.arrivalTime) {
                return {
                    connection,
                    arrivalTime: arrivalTimeByTransfers[transfer].arrivalTime,
                };
            }
            return earliestArrival;
        });
    }
    constructor(maximumTransfers) {
        super();
        for (let amountOfTransfers = 0; amountOfTransfers < maximumTransfers + 1; amountOfTransfers++) {
            this[amountOfTransfers] = {
                arrivalTime: Infinity,
                connection: undefined,
            };
        }
    }
}
exports.default = EarliestArrivalByTransfers;
//# sourceMappingURL=EarliestArrivalByTransfers.js.map