import LDFetch from "ldfetch";
import { HydraTemplateMapping } from "../../entities/hydra/mapping";
import { HydraTemplate } from "../../entities/hydra/search";
import { LDLoader } from "../../loader/ldloader";
import { ThingView } from "../../loader/views/single";
import IHydraTemplateFetcher from "./IHydraTemplateFetcher";
export default class HydraTemplateFetcherDefault implements IHydraTemplateFetcher {
    protected ldFetch: LDFetch;
    protected ldLoader: LDLoader;
    constructor(ldFetch: LDFetch);
    get(url: string): Promise<HydraTemplate>;
    protected getView(): ThingView<HydraTemplate>;
    protected getMappingView(): ThingView<HydraTemplateMapping>;
}
