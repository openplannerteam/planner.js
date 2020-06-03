import { injectable, inject } from "inversify";
import ISmartTileProvider from "./ISmartTileProvider";
import ITransitTileFetcher from "./ITransitTileFetcher";
import RoutableTileRegistry from "../../entities/tiles/registry";
import { ITransitTileIndex, TransitTile, IRoutableTileIndex, RoutableTile } from "../../entities/tiles/tile";
import ILocation from "../../interfaces/ILocation";
import TYPES from "../../types";
import { RoutableTileNode } from "../../entities/tiles/node";
import { EventEmitter } from "events";
import EventBus from "../../events/EventBus";
import EventType from "../../events/EventType";
import IRoutableTileFetcher from "./IRoutableTileFetcher";
import ICatalogProvider from "../catalog/ICatalogProvider";
import { classifyDataSet } from "../../data/classify";
import { DataType } from "../..";

@injectable()
export default class SmartTileProvider implements ISmartTileProvider {

    protected fetcher: ITransitTileFetcher;
    protected baseFetcher: IRoutableTileFetcher;
    protected registry: RoutableTileRegistry;
    protected tiles: ITransitTileIndex = {};
    protected metaTiles: ITransitTileIndex = {};
    protected baseTiles: IRoutableTileIndex = {};
    protected metaBaseTiles: IRoutableTileIndex = {};
    private localNodes: ILocation[];
    private transitRoot: string;
    private routableRoot: string;
    private eventBus: EventEmitter;
    protected catalogProvider: ICatalogProvider;
    public static numReq: number;

    constructor(
        @inject(TYPES.TransitTileFetcher) fetcher: ITransitTileFetcher,
        @inject(TYPES.RoutableTileFetcher) baseFetcher: IRoutableTileFetcher,
        @inject(TYPES.CatalogProvider) catalogProvider: ICatalogProvider,
    ) {
        this.fetcher = fetcher;
        this.baseFetcher = baseFetcher;
        this.catalogProvider = catalogProvider;
        this.registry = RoutableTileRegistry.getInstance();
        this.eventBus = EventBus.getInstance();
        SmartTileProvider.numReq = 0;
    }

    public async selectDataSources(catalogUrl: string, profileID: string) {
        const catalog = await this.catalogProvider.getCatalog(catalogUrl);

        for (const dataset of catalog.datasets) {
            const source = classifyDataSet(dataset);
            if (source.datatype === DataType.TransitTile && source.profile === profileID) {
                this.transitRoot = source.accessUrl;
            }
            if (source.datatype === DataType.RoutableTile) {
                this.routableRoot = source.accessUrl;
            }
        }

        if (!this.transitRoot || !this.routableRoot) {
            EventBus.getInstance().emit(EventType.Warning, "Didn't found enough datasources to perform planning");
        }
    }

    public async wait() {
        await Promise.all(Object.values(this.tiles));
    }

    public addLocalNodes(nodes: ILocation[]) {
        this.localNodes = nodes;
    }

    public async getByUrl(url: string): Promise<TransitTile> {
        if (url && !this.tiles[url]) {
            SmartTileProvider.numReq++;
            this.tiles[url] = this.fetcher.get(url);
        }

        return await this.tiles[url];
    }

    public async getRTByUrl(url: string): Promise<RoutableTile> {
        if (url && !this.baseTiles[url]) {
            SmartTileProvider.numReq++;
            this.baseTiles[url] = this.baseFetcher.get(url);
        }

        return await this.baseTiles[url];
    }

    public async getMetaByUrl(url: string): Promise<TransitTile> {
        if (url && !this.metaTiles[url]) {
            SmartTileProvider.numReq++;
            this.metaTiles[url] = this.fetcher.getMetaData(url);
        }

        return await this.metaTiles[url];
    }

    public async getRoutableMetaByUrl(url: string): Promise<RoutableTile> {
        if (url && !this.metaBaseTiles[url]) {
            SmartTileProvider.numReq++;
            this.metaBaseTiles[url] = this.baseFetcher.getMetaData(url);
        }

        return await this.metaBaseTiles[url];
    }

    public async fetchCorrectTile(node: RoutableTileNode, local?: boolean) {
        if (local) {
            return await this.getRTByUrl(await this.traverseRoutableTree(node));
        }
        else {
            return await this.getByUrl(await this.traverseTransitTree(node));
        }
    }

    public async traverseTransitTree(node: ILocation) {
        let tile: TransitTile;
        tile = await this.getMetaByUrl(this.transitRoot);

        while (tile.getArea().contains(this.localNodes[0]) || tile.getArea().contains(this.localNodes[1])) {
            let newTile: TransitTile;
            for (const rel of tile.getRelations()) {
                if (rel.geoValue.contains(node) && !(rel.geoValue.contains(this.localNodes[0]) || rel.geoValue.contains(this.localNodes[1]))) {
                    newTile = await this.getByUrl(rel.id);
                }
                else if (rel.geoValue.contains(node)) {
                    newTile = await this.getMetaByUrl(rel.id);
                }
            }
            if (newTile) {
                this.eventBus.emit(EventType.FetchedTile, { tileCoordinates: tile.area.area.coordinates, tileNumberX: tile.coordinate.x, tileNumberY: tile.coordinate.y, tileZoom: tile.coordinate.zoom });
                tile = newTile;
            }
            else {
                return null;
            }
        }
        return tile.id;
    }


    public async traverseRoutableTree(node: ILocation) {
        let tile: RoutableTile;
        let newTile: RoutableTile;

        tile = await this.getRoutableMetaByUrl(this.routableRoot);

        while (tile.getRelations().size > 0) {
            for (const rel of tile.getRelations()) {
                if (rel.geoValue.contains(node)) {
                    newTile = await this.getRoutableMetaByUrl(rel.id);
                    if (newTile && newTile.getRelations().size === 0) {
                        this.eventBus.emit(EventType.FetchedTile, { tileCoordinates: rel.geoValue.area.coordinates, tileNumberX: tile.coordinate.x, tileNumberY: tile.coordinate.y, tileZoom: tile.coordinate.zoom });
                    }
                }
            }
            if (newTile) {
                if (newTile.getRelations().size != 0) {
                    this.eventBus.emit(EventType.FetchedTile, { tileCoordinates: tile.area.area.coordinates, tileNumberX: tile.coordinate.x, tileNumberY: tile.coordinate.y, tileZoom: tile.coordinate.zoom });
                }
                tile = newTile;
            }
            else {
                return null;
            }
        }
        return tile.id;
    }

    public getTileFromCache(id: string) {
        return this.tiles[id];
    }
}