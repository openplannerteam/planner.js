import ITransferProfile from "./ITransferProfile";

/**
 * Interface for the CSA profile.
 *
 * @property departureTime Describes the departure time in milliseconds to the target.
 * @property transferProfiles Stores an [[ITransferProfile]] for a maximum amount of transfers that can be made.
 */
export default interface IProfile {
  departureTime: number;

  transferProfiles: ITransferProfile[];
}
