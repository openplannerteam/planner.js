import { inject, injectable } from "inversify";
import LDFetch from "ldfetch";
import { HydraTemplateMapping } from "../../entities/hydra/mapping";
import { HydraTemplate } from "../../entities/hydra/search";
import { LDLoader } from "../../loader/ldloader";
import { ThingView } from "../../loader/views/single";
import TYPES from "../../types";
import { HYDRA } from "../../uri/constants";
import URI from "../../uri/uri";
import IHydraTemplateFetcher from "./IHydraTemplateFetcher";

@injectable()
export default class HydraTemplateFetcherDefault implements IHydraTemplateFetcher {

    protected ldFetch: LDFetch;
    protected ldLoader: LDLoader;

    constructor(
        @inject(TYPES.LDFetch) ldFetch: LDFetch,
    ) {
        this.ldFetch = ldFetch;
        this.ldLoader = new LDLoader();

        // unordered collections
        this.ldLoader.defineCollection(URI.inNS(HYDRA, "mapping"));
    }

    public async get(url: string): Promise<HydraTemplate> {
        const rdfThing = await this.ldFetch.get(url);
        const triples = rdfThing.triples;

        const [profile] = this.ldLoader.process(triples, [
            this.getView(),
        ]);

        profile.id = url;

        return profile;
    }

    protected getView() {
        const view = new ThingView(HydraTemplate.create);
        view.addFilter((entity) =>
            entity[URI.inNS(HYDRA, "template")] !== undefined,
        );
        view.addMapping(URI.inNS(HYDRA, "template"), "template");
        view.addMapping(URI.inNS(HYDRA, "mapping"), "mappings", this.getMappingView());
        return view;
    }

    protected getMappingView() {
        const view = new ThingView(HydraTemplateMapping.create);
        view.addFilter((entity) =>
            entity[URI.inNS(HYDRA, "variable")] !== undefined,
        );
        view.addMapping(URI.inNS(HYDRA, "variable"), "variable");
        view.addMapping(URI.inNS(HYDRA, "required"), "required");
        view.addMapping(URI.inNS(HYDRA, "property"), "property");
        return view;
    }
}
