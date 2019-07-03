import IArrivalTimeByTransfers from "../IArrivalTimeByTransfers";
import IProfile from "./IProfile";
import ITransferProfile from "./ITransferProfile";

/**
 * A factory that create's an [[IProfile]] based on the maximum amount of transfers and/or [[ITransferProfile]]s.
 *
 * @implements [[IProfile]]
 */
export default class Profile implements IProfile {

  public static create(amountOfTransfers: number): Profile {
    return new Profile(
      amountOfTransfers,
    );
  }

  public static createFromTransfers(
    departureTime: number,
    transferProfiles?: ITransferProfile[],
  ): Profile {
    return new Profile(
      transferProfiles.length,
      departureTime,
      transferProfiles,
    );
  }

  public departureTime: number;
  public transferProfiles: ITransferProfile[];

  constructor(
    amountOfTransfers: number,
    departureTime?: number,
    transferProfiles?: ITransferProfile[],
  ) {
    this.departureTime = departureTime || Infinity;

    if (transferProfiles) {
      this.transferProfiles = transferProfiles;
    } else {
      this.transferProfiles = Array(amountOfTransfers + 1).fill({
        exitConnection: undefined,
        enterConnection: undefined,
        arrivalTime: Infinity,
      });
    }
  }

  public isDominated(arrivalTimeByTransfers: IArrivalTimeByTransfers, departureTime: number): boolean {
    return this.transferProfiles.reduce((
      memo: boolean,
      transferProfile: ITransferProfile,
      amountOfTransfers: number,
      ) =>
      memo && transferProfile.arrivalTime <= arrivalTimeByTransfers[amountOfTransfers].arrivalTime &&
          (!transferProfile.departureTime || transferProfile.departureTime >= departureTime)
      , true);
  }

  public getArrivalTimeByTransfers(tripId?: string): IArrivalTimeByTransfers {
    return this.transferProfiles.map((transfer: ITransferProfile) => ({
      arrivalTime: transfer.arrivalTime,
      tripId,
    }));
  }
}
