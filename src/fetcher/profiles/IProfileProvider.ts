import Profile from "../../entities/profile/Profile";

export default interface IProfileProvider {
  setActiveProfile(profile: Profile): void;
  setActiveProfileID(profileId: string): void;

  addProfile(profile: Profile): void;

  getActiveProfile(): Profile;
  getProfile(profileId: string): Promise<Profile>;
  getProfiles(): Promise<Profile[]>;
}