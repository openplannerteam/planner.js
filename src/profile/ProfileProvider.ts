import { injectable } from "inversify";
import TravelMode from "../enums/TravelMode";
import Profile from "../profile/Profile";
import PedestrianProfile from "./PedestrianProfile";

interface IProfileMap {
  [label: string]: Profile;
}

@injectable()
export default class ProfileProvider {
  // todo, fetcher that loads a profile from a URI
  // todo, profiles per location
  //       e.g. bicycle near a specific station

  private travelModeProfiles: Map<TravelMode, Profile>;
  private profiles: IProfileMap;
  private activeProfile: Profile;

  constructor() {
    this.profiles = {};
    this.travelModeProfiles = new Map();
    this.activeProfile = undefined;

    // some placeholders
    const pedestrian = new PedestrianProfile();
    this.travelModeProfiles.set(TravelMode.Walking, pedestrian);
    this.setActiveProfile(pedestrian);
  }

  public setActiveProfile(profile: Profile) {
    if (!this.profiles[profile.getID()]) {
      this.addProfile(profile);
    }
    this.activeProfile = profile;
  }

  public setActiveProfileID(profileId: string) {
    this.activeProfile = this.profiles[profileId];
  }

  public getActiveProfile(): Profile {
    return this.activeProfile;
  }

  public addProfile(profile: Profile) {
    this.profiles[profile.getID()] = profile;
  }

  public getProfile(profileId: string): Profile {
    return this.profiles[profileId];
  }

  public getProfiles(): Profile[] {
    return Object.values(this.profiles);
  }
}
