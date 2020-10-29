import ITransferProfile from "./ITransferProfile";
/**
 * Stores multiple [[IProfile]]'s ordered by departure time for an [[IStop]].
 */
export default interface IProfileByStop {
    [stop: string]: ITransferProfile;
}
