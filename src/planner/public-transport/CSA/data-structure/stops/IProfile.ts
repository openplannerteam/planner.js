import ITransferProfile from "./ITransferProfile";

export default interface IProfile {
  departureTime: number;

  transferProfiles: ITransferProfile[];
}
