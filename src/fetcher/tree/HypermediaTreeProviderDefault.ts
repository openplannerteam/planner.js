import { inject, injectable } from "inversify";
import HypermediaTree from "../../entities/tree/tree";
import TYPES from "../../types";
import IHypermediaTreeProvider from "./IHeadermediaTreeProvider";
import IHypermediaTreeFetcher from "./IHypermediaTreeFetcher";

@injectable()
export default class HypermediaTreeProviderDefault implements IHypermediaTreeProvider {
    private accessUrls: string[];
    private allTrees: Promise<HypermediaTree[]>;
    private treeFetcher: IHypermediaTreeFetcher;

    constructor(
        @inject(TYPES.HypermediaTreeFetcher) treeFetcher: IHypermediaTreeFetcher,
    ) {
        this.accessUrls = [];
        this.treeFetcher = treeFetcher;
    }

    public addTreeSource(accessUrl: string) {
        this.allTrees = null;
        this.accessUrls.push(accessUrl);
    }

    public async getAllTrees(): Promise<HypermediaTree[]> {
        if (!this.allTrees) {
            this.allTrees = Promise.all(this.accessUrls
                .map((url: string) => this.treeFetcher.get(url)),
            );
        }

        return this.allTrees;
    }
}
