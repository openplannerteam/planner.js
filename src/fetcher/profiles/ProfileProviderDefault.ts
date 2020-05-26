import { inject, injectable } from "inversify";
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
  private fetcher: IProfileFetcher;

  private developmentProfile: Profile; // does not have a persistent id, will change often
  private developmentProfileCounter: number;

  constructor(
    @inject(TYPES.ProfileFetcher) fetcher: IProfileFetcher,
  ) {
    this.profiles = {};
    this.fetcher = fetcher;
    this.developmentProfile = undefined;
    this.developmentProfileCounter = 0;
  }

  public async parseDevelopmentProfile(blob: object): Promise<string> {
    this.developmentProfileCounter += 1;
    const newProfile = await this.fetcher.parseProfileBlob(blob, "" + this.developmentProfileCounter);
    if (this.developmentProfile) {
      // delete this.profiles[this.developmentProfile.getID()];
    }
    this.developmentProfile = newProfile;
    this.profiles[this.developmentProfile.getID()] = Promise.resolve(newProfile);
    return newProfile.getID();
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
