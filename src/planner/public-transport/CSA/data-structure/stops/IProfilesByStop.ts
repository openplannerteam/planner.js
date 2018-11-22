import IProfile from "./Profile";

/**
 * Stores multiple [[IProfile]]'s ordered by departure time for an [[IStop]].
 */
export default interface IProfilesByStop {
  [stop: string]: IProfile[];
}
