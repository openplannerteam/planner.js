import { inject, injectable } from "inversify";
import LDFetch from "ldfetch";
import { Footpath, IFootpathIndex } from "../../entities/footpaths/footpath";
import { LDLoader } from "../../loader/ldloader";
import { IndexThingView } from "../../loader/views";
import TYPES from "../../types";
import { PLANNER } from "../../uri/constants";
import URI from "../../uri/uri";
import IFootpathsProvider from "./IFootpathsProvider";

@injectable()
export default class FootpathsProviderDefault implements IFootpathsProvider {

    protected ldFetch: LDFetch;
    protected ldLoader: LDLoader;
    protected paths: IFootpathIndex;

    constructor(
        @inject(TYPES.LDFetch) ldFetch: LDFetch,
    ) {
        this.ldFetch = ldFetch;
        this.ldLoader = new LDLoader();
        this.paths = null;
    }

    public async prefetch() {
        this.get();
    }

    public async get(): Promise<IFootpathIndex> {
        if (!this.paths) {
            const rdfThing = await this.ldFetch.get("https://hdelva.be/stops/distances");
            const triples = rdfThing.triples;

            const [paths] = this.ldLoader.process(triples, [
                this.getPathsView(),
            ]);
            this.paths = paths;
        }

        return this.paths;
    }

    protected getPathsView() {
        const nodesView = new IndexThingView(Footpath.create);
        nodesView.addMapping(URI.inNS(PLANNER, "source"), "from");
        nodesView.addMapping(URI.inNS(PLANNER, "destination"), "to");
        nodesView.addMapping(URI.inNS(PLANNER, "distance"), "distance");
        return nodesView;
    }
}
