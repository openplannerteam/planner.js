import { inject, injectable } from "inversify";
import PedestrianProfile from "../../entities/profile/PedestrianProfile";
import Profile from "../../entities/profile/Profile";
import TYPES from "../../types";
import IProfileFetcher from "./IProfileFetcher";
import IProfileProvider from "./IProfileProvider";

interface IProfileMap {
  [label: string]: Promise<Profile>;
}

@injectable()
export default class ProfileProviderDefault implements IProfileProvider {
  // todo, fetcher that loads a profile from a URI
  // todo, profiles per location
  //       e.g. bicycle near a specific station

  private profiles: IProfileMap;
  private activeProfile: Profile;
  private fetcher: IProfileFetcher;

  constructor(
    @inject(TYPES.ProfileFetcher) fetcher: IProfileFetcher,
  ) {
    this.profiles = {};
    this.activeProfile = undefined;
    this.fetcher = fetcher;

    // some placeholders
    const pedestrian = new PedestrianProfile();
    this.setActiveProfile(pedestrian);
  }

  public setActiveProfile(profile: Profile) {
    if (!this.profiles[profile.getID()]) {
      this.addProfile(profile);
    }
    this.activeProfile = profile;
  }

  public async setActiveProfileID(profileId: string) {
    await this.getProfile(profileId).then((profile) => {
      this.activeProfile = profile;
    });
  }

  public getActiveProfile(): Profile {
    return this.activeProfile;
  }

  public addProfile(profile: Profile) {
    this.profiles[profile.getID()] = Promise.resolve(profile);
  }

  public getProfile(profileId: string): Promise<Profile> {
    if (this.profiles[profileId] === undefined) {
      this.profiles[profileId] = this.fetcher.get(profileId);
    }
    return this.profiles[profileId];
  }

  public getProfiles(): Promise<Profile[]> {
    return Promise.all(Object.values(this.profiles));
  }
}
