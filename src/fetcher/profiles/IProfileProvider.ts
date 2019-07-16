import Profile from "../../entities/profile/Profile";

export default interface IProfileProvider {
  setActiveProfile(profile: Profile): void;
  setActiveProfileID(profileId: string): void;

  setDevelopmentProfile(blob: object): Promise<string>;
  addProfile(profile: Profile): void;

  getActiveProfile(): Promise<Profile>;
  getProfile(profileId: string): Promise<Profile>;
  getProfiles(): Promise<Profile[]>;
}
