import LDFetch from "ldfetch";
import { Footpath, IFootpathIndex } from "../../entities/footpaths/footpath";
import TileCoordinate from "../../entities/tiles/TileCoordinate";
import ILocation from "../../interfaces/ILocation";
import { LDLoader } from "../../loader/ldloader";
import { IndexThingView } from "../../loader/views";
import IStop from "../stops/IStop";
import IFootpathsProvider from "./IFootpathsProvider";
interface ITiledFootpathIndex {
    [id: string]: Promise<IFootpathIndex>;
}
export default class FootpathsProviderDefault implements IFootpathsProvider {
    protected ldFetch: LDFetch;
    protected ldLoader: LDLoader;
    protected paths: ITiledFootpathIndex;
    constructor(ldFetch: LDFetch);
    get(stop: IStop): Promise<IFootpathIndex>;
    getIdForLocation(zoom: number, location: ILocation): string;
    getIdForTileCoords(coordinate: TileCoordinate): string;
    getByLocation(zoom: number, location: ILocation): Promise<IFootpathIndex>;
    getByTileCoords(coordinate: TileCoordinate): Promise<IFootpathIndex>;
    protected getByUrl(url: string): Promise<IFootpathIndex>;
    protected getPathsView(): IndexThingView<Footpath>;
}
export {};
