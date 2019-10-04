import Profile from "../../entities/profile/Profile";

export default interface IProfileProvider {
  parseDevelopmentProfile(blob: object): Promise<string>;
  addProfile(profile: Profile): void;

  getProfile(profileId: string): Promise<Profile>;
  getProfiles(): Promise<Profile[]>;
}
