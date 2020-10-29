"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A factory that create's an [[IProfile]] based on the maximum amount of transfers and/or [[ITransferProfile]]s.
 *
 * @implements [[IProfile]]
 */
class Profile {
    constructor(amountOfTransfers, departureTime, transferProfiles) {
        this.departureTime = departureTime || Infinity;
        if (transferProfiles) {
            this.transferProfiles = transferProfiles;
        }
        else {
            this.transferProfiles = Array(amountOfTransfers + 1).fill({
                exitConnection: undefined,
                enterConnection: undefined,
                arrivalTime: Infinity,
            });
        }
    }
    static create(amountOfTransfers) {
        return new Profile(amountOfTransfers);
    }
    static createFromTransfers(departureTime, transferProfiles) {
        return new Profile(transferProfiles.length, departureTime, transferProfiles);
    }
    isDominated(arrivalTimeByTransfers, departureTime) {
        return this.transferProfiles.reduce((memo, transferProfile, amountOfTransfers) => memo && transferProfile.arrivalTime <= arrivalTimeByTransfers[amountOfTransfers].arrivalTime &&
            (!transferProfile.departureTime || transferProfile.departureTime >= departureTime), true);
    }
    getArrivalTimeByTransfers(tripId) {
        return this.transferProfiles.map((transfer) => ({
            arrivalTime: transfer.arrivalTime,
            tripId,
        }));
    }
}
exports.default = Profile;
//# sourceMappingURL=Profile.js.map