import { inject, injectable } from "inversify";
import LDFetch from "ldfetch";
import { Catalog } from "../../entities/catalog/catalog";
import { Dataset } from "../../entities/catalog/dataset";
import DatasetDistribution from "../../entities/catalog/dataset_distribution";
import { LDLoader } from "../../loader/ldloader";
import { ThingView } from "../../loader/views/single";
import TYPES from "../../types";
import { DCAT, DCT } from "../../uri/constants";
import URI from "../../uri/uri";
import ICatalogFetcher from "./ICatalogFetcher";

@injectable()
export default class CatalogFetcherDefault implements ICatalogFetcher {

    protected ldFetch: LDFetch;
    protected ldLoader: LDLoader;

    constructor(
        @inject(TYPES.LDFetch) ldFetch: LDFetch,
    ) {
        this.ldFetch = ldFetch;
        this.ldLoader = new LDLoader();

        // unordered collections
        this.ldLoader.defineCollection(URI.inNS(DCAT, "distribution"));
        this.ldLoader.defineCollection(URI.inNS(DCAT, "dataset"));
        this.ldLoader.defineCollection(URI.inNS(DCAT, "mediaType"));
    }

    public async get(url: string): Promise<Catalog> {
        const rdfThing = await this.ldFetch.get(url);
        const triples = rdfThing.triples;

        const [profile] = this.ldLoader.process(triples, [
            this.getView(),
        ]);

        profile.id = url;

        return profile;
    }

    protected getView() {
        const view = new ThingView(Catalog.create);
        view.addFilter((entity) =>
            entity[URI.inNS(DCAT, "dataset")] !== undefined,
        );
        view.addMapping(URI.inNS(DCT, "publisher"), "publisher");
        view.addMapping(URI.inNS(DCAT, "dataset"), "datasets", this.getDatasetView());
        return view;
    }

    protected getDatasetView() {
        const view = new ThingView(Dataset.create);
        view.addFilter((entity) =>
            entity[URI.inNS(DCAT, "distribution")] !== undefined,
        );
        view.addMapping(URI.inNS(DCT, "subject"), "subject");
        view.addMapping(URI.inNS(DCT, "description"), "description");
        view.addMapping(URI.inNS(DCT, "title"), "title");
        view.addMapping(URI.inNS(DCT, "spatial"), "area");
        view.addMapping(URI.inNS(DCAT, "accessRights"), "rights");
        view.addMapping(URI.inNS(DCAT, "distribution"), "distributions", this.getDistributionView());
        return view;
    }

    protected getDistributionView() {
        const view = new ThingView(DatasetDistribution.create);
        view.addMapping(URI.inNS(DCAT, "accessURL"), "accessUrl");
        view.addMapping(URI.inNS(DCAT, "mediaType"), "mediatypes");
        return view;
    }
}
