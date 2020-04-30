import { inject, injectable } from "inversify";
import LDFetch from "ldfetch";
import { Footpath, IFootpathIndex } from "../../entities/footpaths/footpath";
import TileCoordinate from "../../entities/tiles/TileCoordinate";
import ILocation from "../../interfaces/ILocation";
import { LDLoader } from "../../loader/ldloader";
import { IndexThingView } from "../../loader/views";
import TYPES from "../../types";
import { PLANNER } from "../../uri/constants";
import URI from "../../uri/uri";
import { lat_to_tile, long_to_tile } from "../../util/Tiles";
import IStop from "../stops/IStop";
import IFootpathsProvider from "./IFootpathsProvider";

const ZOOM = 12;

interface ITiledFootpathIndex {
    [id: string]: Promise<IFootpathIndex>;
}

@injectable()
export default class FootpathsProviderDefault implements IFootpathsProvider {

    protected ldFetch: LDFetch;
    protected ldLoader: LDLoader;
    protected paths: ITiledFootpathIndex;

    constructor(
        @inject(TYPES.LDFetch) ldFetch: LDFetch,
    ) {
        this.ldFetch = ldFetch;
        this.ldLoader = new LDLoader();
        this.paths = {};
    }

    public async get(stop: IStop): Promise<IFootpathIndex> {
        const tileId = this.getIdForLocation(ZOOM, stop);
        if (!this.paths[tileId]) {
            this.paths[tileId] = this.getByUrl(tileId);
        }

        return this.paths[tileId];
    }

    public getIdForLocation(zoom: number, location: ILocation): string {
        const y = lat_to_tile(location.latitude, zoom);
        const x = long_to_tile(location.longitude, zoom);
        const coordinate = new TileCoordinate(zoom, x, y );
        return this.getIdForTileCoords(coordinate);
      }

    public getIdForTileCoords(coordinate: TileCoordinate): string {
        return `https://hdelva.be/stops/distances/${coordinate.zoom}/${coordinate.x}/${coordinate.y}`;
    }

    public getByLocation(zoom: number, location: ILocation): Promise<IFootpathIndex> {
        const y = lat_to_tile(location.latitude, zoom);
        const x = long_to_tile(location.longitude, zoom);
        const coordinate = new TileCoordinate(zoom, x, y);
        return this.getByTileCoords(coordinate);
    }

    public async getByTileCoords(coordinate: TileCoordinate): Promise<IFootpathIndex> {
        const url = this.getIdForTileCoords(coordinate);
        return await this.getByUrl(url);
    }

    protected async getByUrl(url: string): Promise<IFootpathIndex> {
        const rdfThing = await this.ldFetch.get(url);
        const triples = rdfThing.triples;

        const [paths] = this.ldLoader.process(triples, [
            this.getPathsView(),
        ]);
        return paths;
    }

    protected getPathsView() {
        const nodesView = new IndexThingView(Footpath.create);
        nodesView.addMapping(URI.inNS(PLANNER, "source"), "from");
        nodesView.addMapping(URI.inNS(PLANNER, "destination"), "to");
        nodesView.addMapping(URI.inNS(PLANNER, "distance"), "distance");
        return nodesView;
    }
}
