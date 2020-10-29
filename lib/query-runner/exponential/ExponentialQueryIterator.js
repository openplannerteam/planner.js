"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asynciterator_1 = require("asynciterator");
/**
 * This AsyncIterator emits [[IResolvedQuery]] instances with exponentially increasing `maximumArrivalTime`.
 * For each emitted query, the time frame gets doubled (x2).
 */
class ExponentialQueryIterator extends asynciterator_1.AsyncIterator {
    constructor(baseQuery, initialTimespan) {
        super();
        this.baseQuery = baseQuery;
        this.timespan = initialTimespan;
        this.readable = true;
    }
    read() {
        if (this.closed) {
            return null;
        }
        const { minimumDepartureTime } = this.baseQuery;
        const maximumArrivalTime = new Date(minimumDepartureTime.getTime() + this.timespan);
        this.timespan *= 2;
        if (this.timespan > 2 * 24 * 60 * 60 * 1000) {
            this.close();
        }
        return Object.assign({}, this.baseQuery, { maximumArrivalTime });
    }
}
exports.default = ExponentialQueryIterator;
//# sourceMappingURL=ExponentialQueryIterator.js.map