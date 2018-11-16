import IArrivalTimeByTransfers from "../IArrivalTimeByTransfers";
import IProfile from "./IProfile";
import ITransferProfile from "./ITransferProfile";

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
      this.transferProfiles = Array(amountOfTransfers).fill({
        exitConnection: undefined,
        enterConnection: undefined,
        arrivalTime: Infinity,
      });
    }
  }

  public isDominatedBy(arrivalTimeByTransfers: IArrivalTimeByTransfers): boolean {
    return this.transferProfiles.reduce((
      memo: boolean,
      transferProfile: ITransferProfile,
      amountOfTransfers: number,
      ) =>
      memo && transferProfile.arrivalTime > arrivalTimeByTransfers[amountOfTransfers]
      , true);
  }

  public getArrivalTimeByTransfers(): IArrivalTimeByTransfers {
    return this.transferProfiles.map((transfer: ITransferProfile) => transfer.arrivalTime);
  }
}
