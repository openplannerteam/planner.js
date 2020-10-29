"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DropOffType_1 = __importDefault(require("../../../../enums/DropOffType"));
/**
 * Utility functions that can be used on the CSA profiles [[IProfilesByStop]].
 */
class ProfileUtil {
    static filterInfinity(profilesByStop) {
        const result = {};
        for (const stop in profilesByStop) {
            if (profilesByStop.hasOwnProperty(stop)) {
                result[stop] = profilesByStop[stop].filter((profile) => profile.departureTime !== Infinity);
                if (result[stop].length === 0) {
                    delete result[stop];
                }
            }
        }
        return result;
    }
    static getTransferTimes(profilesByStop, connection, maxLegs, minimumTransferDuration, maximumTransferDuration) {
        const { arrivalStop, arrivalTime } = connection;
        const trip = connection.tripId;
        if (connection.dropOffType !== DropOffType_1.default.NotAvailable) {
            let profileIndex = profilesByStop[arrivalStop].length - 1;
            while (profileIndex >= 0) {
                const departure = profilesByStop[arrivalStop][profileIndex].departureTime;
                const arrival = arrivalTime.getTime();
                const transferDuration = departure - arrival;
                if (transferDuration >= minimumTransferDuration && transferDuration <= maximumTransferDuration) {
                    const arrivalTimeByTransfers = profilesByStop[arrivalStop][profileIndex].getArrivalTimeByTransfers(trip);
                    return arrivalTimeByTransfers.slice();
                }
                profileIndex--;
            }
        }
        return Array(maxLegs + 1).fill({
            arrivalTime: Infinity,
            tripId: trip,
        });
    }
}
exports.default = ProfileUtil;
//# sourceMappingURL=ProfileUtil.js.map