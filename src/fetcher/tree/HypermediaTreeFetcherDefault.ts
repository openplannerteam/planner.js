import { inject, injectable } from "inversify";
import LDFetch from "ldfetch";
import { LDLoader } from "../../loader/ldloader";
import { ThingView } from "../../loader/views/single";
import TYPES from "../../types";
import { GEOSPARQL, RDF, TREE } from "../../uri/constants";
import URI from "../../uri/uri";

import GeoFragment from "../../entities/tree/geometry";
import HypermediaTreeRelation from "../../entities/tree/relation";
import HypermediaTree from "../../entities/tree/tree";
import IHypermediaTreeFetcher from "./IHypermediaTreeFetcher";

@injectable()
export default class HypermediaTreeFetcherDefault implements IHypermediaTreeFetcher {

    protected ldFetch: LDFetch;
    protected ldLoader: LDLoader;

    constructor(
        @inject(TYPES.LDFetch) ldFetch: LDFetch,
    ) {
        this.ldFetch = ldFetch;
        this.ldLoader = new LDLoader();
        this.ldLoader.defineCollection(URI.inNS(TREE, "relation"));
    }

    public async get(url: string): Promise<HypermediaTree> {
        const rdfThing = await this.ldFetch.get(url);
        const triples = rdfThing.triples;

        const [fragment] = this.ldLoader.process(triples, [
            this.getView(),
        ]);

        fragment.id = url;

        return fragment;
    }

    protected getView() {
        const view = new ThingView(HypermediaTree.create);
        view.addFilter(
            (entity) => {
                return entity[URI.inNS(TREE, "relation")] !== undefined;
            },
        );
        view.addMapping(URI.inNS(TREE, "relation"), "relations", this.getRelationView());
        return view;
    }

    protected getRelationView() {
        const view = new ThingView(HypermediaTreeRelation.create);
        view.addFilter(
            (entity) => {
                return entity[URI.inNS(RDF, "type")] === URI.inNS(TREE, "GeospatiallyContainsRelation");
            },
        );
        view.addMapping(URI.inNS(TREE, "node"), "node");
        view.addMapping(URI.inNS(TREE, "value"), "geoValue", this.getFragmentView());
        return view;
    }

    protected getFragmentView() {
        const view = new ThingView(GeoFragment.create);
        view.addFilter(
            (entity) => {
                return entity[URI.inNS(RDF, "type")] === URI.inNS(GEOSPARQL, "Geometry");
            },
        );
        view.addMapping(URI.inNS(GEOSPARQL, "asWKT"), "area");
        return view;
    }
}
