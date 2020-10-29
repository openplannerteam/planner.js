import LDFetch from "ldfetch";
import { LDLoader } from "../../loader/ldloader";
import { ThingView } from "../../loader/views/single";
import GeoFragment from "../../entities/tree/geometry";
import HypermediaTreeRelation from "../../entities/tree/relation";
import HypermediaTree from "../../entities/tree/tree";
import IHypermediaTreeFetcher from "./IHypermediaTreeFetcher";
export default class HypermediaTreeFetcherDefault implements IHypermediaTreeFetcher {
    protected ldFetch: LDFetch;
    protected ldLoader: LDLoader;
    constructor(ldFetch: LDFetch);
    get(url: string): Promise<HypermediaTree>;
    protected getView(): ThingView<HypermediaTree>;
    protected getRelationView(): ThingView<HypermediaTreeRelation>;
    protected getFragmentView(): ThingView<GeoFragment>;
}
