import { inject, injectable } from "inversify";
import { DataType } from "../..";
import { Footpath, IFootpathIndex } from "../../entities/footpaths/footpath";
import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";
import EventBus from "../../events/EventBus";
import EventType from "../../events/EventType";
import ILocation from "../../interfaces/ILocation";
import { lat_to_tile, long_to_tile } from "../../util/Tiles";
import IStop from "../stops/IStop";
import IFootpathsProvider from "./IFootpathsProvider";

const ZOOM = 12;

interface ITiledFootpathIndex {
    [id: string]: Promise<IFootpathIndex>;
}

@injectable()
export default class FootpathsProviderRaw implements IFootpathsProvider {
    protected paths: ITiledFootpathIndex;

    constructor() {
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
        const coordinate = new RoutableTileCoordinate(zoom, x, y);
        return this.getIdForTileCoords(coordinate);
    }

    public getIdForTileCoords(coordinate: RoutableTileCoordinate): string {
        return `https://hdelva.be/stops/distances/${coordinate.zoom}/${coordinate.x}/${coordinate.y}`;
    }

    public getByLocation(zoom: number, location: ILocation): Promise<IFootpathIndex> {
        const y = lat_to_tile(location.latitude, zoom);
        const x = long_to_tile(location.longitude, zoom);
        const coordinate = new RoutableTileCoordinate(zoom, x, y);
        return this.getByTileCoords(coordinate);
    }

    public async getByTileCoords(coordinate: RoutableTileCoordinate): Promise<IFootpathIndex> {
        const url = this.getIdForTileCoords(coordinate);
        return await this.getByUrl(url);
    }

    protected async getByUrl(url: string): Promise<IFootpathIndex> {
        const beginTime = new Date();
        const response = await fetch(url);
        const size = parseInt(response.headers.get("content-length"), 10);
        const duration = (new Date()).getTime() - beginTime.getTime();

        const responseText = await response.text();

        const footpaths: IFootpathIndex = {};

        if (response.status !== 200) {
            EventBus.getInstance().emit(EventType.Warning, `${url} responded with status code ${response.status}`);
        }

        if (response.status === 200 && responseText) {
            const blob = JSON.parse(responseText);

            for (const entity of blob["@graph"]) {
                const id = entity["@id"];
                const footpath = new Footpath(id);
                footpath.to = entity["planner:destination"];
                footpath.from = entity["planner:source"];
                footpath.distance = entity["planner:distance"];
                footpaths[id] = footpath;
            }
        }

        EventBus.getInstance().emit(
            EventType.ResourceFetch,
            {
                datatype: DataType.Footpath,
                url,
                duration,
                size,
            },
        );

        return footpaths;
    }
}
