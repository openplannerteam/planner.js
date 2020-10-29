import Profile from "../../entities/profile/Profile";
import IProfileFetcher from "./IProfileFetcher";
import IProfileProvider from "./IProfileProvider";
export default class ProfileProviderDefault implements IProfileProvider {
    private profiles;
    private fetcher;
    private developmentProfile;
    private developmentProfileCounter;
    constructor(fetcher: IProfileFetcher);
    parseDevelopmentProfile(blob: object): Promise<string>;
    addProfile(profile: Profile): void;
    getProfile(profileId: string): Promise<Profile>;
    getProfiles(): Promise<Profile[]>;
}
