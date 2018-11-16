import IProfile from "./Profile";

export default interface IProfilesByStop {
  [stop: string]: IProfile[];
}
