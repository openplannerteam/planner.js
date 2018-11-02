import Profile from "./Profile";

export default interface IProfilesByStop {
  [stop: string]: Profile[];
}
