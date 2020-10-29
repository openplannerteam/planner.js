import { IFootpathIndex } from "../../entities/footpaths/footpath";
import TileCoordinate from "../../entities/tiles/TileCoordinate";
import ILocation from "../../interfaces/ILocation";
import IStop from "../stops/IStop";
import IFootpathsProvider from "./IFootpathsProvider";
interface ITiledFootpathIndex {
    [id: string]: Promise<IFootpathIndex>;
}
export default class FootpathsProviderRaw implements IFootpathsProvider {
    protected paths: ITiledFootpathIndex;
    constructor();
    get(stop: IStop): Promise<IFootpathIndex>;
    getIdForLocation(zoom: number, location: ILocation): string;
    getIdForTileCoords(coordinate: TileCoordinate): string;
    getByLocation(zoom: number, location: ILocation): Promise<IFootpathIndex>;
    getByTileCoords(coordinate: TileCoordinate): Promise<IFootpathIndex>;
    protected getByUrl(url: string): Promise<IFootpathIndex>;
    protected parseResponseLength(response: any): number;
}
export {};
