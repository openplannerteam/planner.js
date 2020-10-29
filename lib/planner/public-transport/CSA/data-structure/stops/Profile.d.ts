import IArrivalTimeByTransfers from "../IArrivalTimeByTransfers";
import IProfile from "./IProfile";
import ITransferProfile from "./ITransferProfile";
/**
 * A factory that create's an [[IProfile]] based on the maximum amount of transfers and/or [[ITransferProfile]]s.
 *
 * @implements [[IProfile]]
 */
export default class Profile implements IProfile {
    static create(amountOfTransfers: number): Profile;
    static createFromTransfers(departureTime: number, transferProfiles?: ITransferProfile[]): Profile;
    departureTime: number;
    transferProfiles: ITransferProfile[];
    constructor(amountOfTransfers: number, departureTime?: number, transferProfiles?: ITransferProfile[]);
    isDominated(arrivalTimeByTransfers: IArrivalTimeByTransfers, departureTime: number): boolean;
    getArrivalTimeByTransfers(tripId?: string): IArrivalTimeByTransfers;
}
