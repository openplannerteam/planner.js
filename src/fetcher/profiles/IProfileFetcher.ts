import Profile from "../../entities/profile/Profile";

export default interface IProfileFetcher {
    get(url: string): Promise<Profile>;
}
