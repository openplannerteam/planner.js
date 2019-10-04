import Profile from "../../entities/profile/Profile";

export default interface IProfileFetcher {
    parseProfileBlob(blob: object, id: string): Promise<Profile>;
    get(url: string): Promise<Profile>;
}
