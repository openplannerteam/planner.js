import LDFetch from "ldfetch";
import CharacteristicProfile from "../../entities/profile/CharacteresticProfile";
import Profile from "../../entities/profile/Profile";
import ProfileConclusion from "../../entities/profile/ProfileConclusion";
import ProfileCondition from "../../entities/profile/ProfileCondition";
import ProfileRule from "../../entities/profile/ProfileRule";
import { LDLoader } from "../../loader/ldloader";
import { ThingView } from "../../loader/views/single";
import IProfileFetcher from "./IProfileFetcher";
export default class ProfileFetcherDefault implements IProfileFetcher {
    protected ldFetch: LDFetch;
    protected ldLoader: LDLoader;
    constructor(ldFetch: LDFetch);
    parseProfileBlob(blob: object, id: string): Promise<Profile>;
    get(url: string): Promise<Profile>;
    protected getView(): ThingView<CharacteristicProfile>;
    protected getRuleView(): ThingView<ProfileRule>;
    protected getConditionView(): ThingView<ProfileCondition>;
    protected getConclusionView(): ThingView<ProfileConclusion>;
}
