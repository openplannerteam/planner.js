import HypermediaTree from "../../entities/tree/tree";
import IHypermediaTreeProvider from "./IHeadermediaTreeProvider";
import IHypermediaTreeFetcher from "./IHypermediaTreeFetcher";
export default class HypermediaTreeProviderDefault implements IHypermediaTreeProvider {
    private accessUrls;
    private allTrees;
    private treeFetcher;
    constructor(treeFetcher: IHypermediaTreeFetcher);
    addTreeSource(accessUrl: string): void;
    getAllTrees(): Promise<HypermediaTree[]>;
}
