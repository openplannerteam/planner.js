import { injectable, inject } from "inversify";
import { TransitTileSet, RoutableTileSet } from "../../entities/tiles/set";
import ISmartTileProvider from "./ISmartTileProvider";
import ITransitTileFetcher from "./ITransitTileFetcher";
import RoutableTileRegistry from "../../entities/tiles/registry";
import { ITransitTileIndex, TransitTile, IRoutableTileIndex, RoutableTile } from "../../entities/tiles/tile";
import ILocation from "../../interfaces/ILocation";
import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";
import { lat_to_tile, long_to_tile } from "../../util/Tiles";
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
    private transitRoot: string; // = "http://192.168.56.1:8080/tiles/car/transit_geo/0/0.json";
    private routableRoot: string; // = "http://192.168.56.1:8080/tiles/tree/routable/0/0.json";
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

    public async selectDataSources(catalogUrl: string, profileID: string){
        const catalog = await this.catalogProvider.getCatalog(catalogUrl);

        for(const dataset of catalog.datasets){
            const source = classifyDataSet(dataset);
            if(source.datatype === DataType.TransitTile && source.profile === profileID){
                this.transitRoot = source.accessUrl;
            }
            if(source.datatype === DataType.RoutableTile){
                this.routableRoot = source.accessUrl;
            }
        }

        if(!this.transitRoot || !this.routableRoot){
            EventBus.getInstance().emit(EventType.Warning, "Didn't found enough datasources to perform planning");
        }
    }

    //not sure what this does
    public async wait() {
        await Promise.all(Object.values(this.tiles));
    }

    public addLocalNodes(nodes: ILocation[]) {
        this.localNodes = nodes;
        for(const node of this.localNodes){
        //console.log(node.id + " " + node.longitude + " " + node.latitude);
        //this.eventBus.emit(EventType.AddLocalNode, node);
        }
    }

    // public getIdForLocation(zoom: number, location: ILocation, local?: boolean): string {
    //     const y = lat_to_tile(location.latitude, zoom);
    //     const x = long_to_tile(location.longitude, zoom);
    //     const coordinate = new RoutableTileCoordinate(zoom, x, y);
    //     return this.getIdForTileCoords(coordinate, local);
    // }

    // //this URL is hardcoded to my own (local) fileserver with transit tile data, + points to blabla.json
    // public getIdForTileCoords(coordinate: RoutableTileCoordinate, local?: boolean): string {
    //     //return `https://hdelva.be/tiles/transit/${coordinate.zoom}/${coordinate.x}/${coordinate.y}`;

    //     if(local){
    //         return `https://tiles.openplanner.team/planet/${coordinate.zoom}/${coordinate.x}/${coordinate.y}`;
    //     }
    //     return `http://192.168.56.1:8080/car/transit_geo/${coordinate.zoom}/${coordinate.x}/${coordinate.y}.json`;
    // }

    // public getByLocation(zoom: number, location: ILocation): Promise<TransitTile | RoutableTile> {
    //     const y = this.lat2tile(location.latitude, zoom);
    //     const x = this.long2tile(location.longitude, zoom);
    //     const coordinate = new RoutableTileCoordinate(zoom, x, y);
    //     return this.getByTileCoords(coordinate);
    // }

    // public async getByTileCoords(coordinate: RoutableTileCoordinate): Promise<TransitTile | RoutableTile> {
    //     const url = this.getIdForTileCoords(coordinate);
    //     const tile = await this.getByUrl(url);
    //     tile.coordinate = coordinate;  // todo, get these from server response -> ?
    //     return tile;
    // }

    public async getByUrl(url: string): Promise<TransitTile> {
        if (!this.tiles[url]) {
            SmartTileProvider.numReq++;
            this.tiles[url] = this.fetcher.get(url);
        }

        return await this.tiles[url];
    }

    public async getRTByUrl(url:string): Promise<RoutableTile>{
        if (!this.baseTiles[url]) {
            SmartTileProvider.numReq++;
            this.baseTiles[url] = this.baseFetcher.get(url);
        }

        return await this.baseTiles[url];
    }

    

    public async getMetaByUrl(url: string, routable?:boolean): Promise<TransitTile>{
        if (!this.metaTiles[url]) {
            SmartTileProvider.numReq++;
            this.metaTiles[url] = this.fetcher.getMetaData(url);
        }

        return await this.metaTiles[url];
    }

    public async getRoutableMetaByUrl(url:string, routable?:boolean): Promise<RoutableTile>{
        if (!this.metaBaseTiles[url]) {
            SmartTileProvider.numReq++;
            this.metaBaseTiles[url] = this.baseFetcher.getMetaData(url);
        }

        return await this.metaBaseTiles[url];
    }

    // public async getMultipleByUrl(urls: string[]): Promise<TransitTileSet | RoutableTileSet> {
    //     const tiles = await Promise.all(urls.map((url) => {
    //         return this.getByUrl(url);
    //     }));

    //     return new TransitTileSet(tiles);
    // }

    // public async getmultipleByLocation(zoom: number, locations: ILocation[]): Promise<TransitTileSet> {
    //     const tiles = await Promise.all(locations.map((location) => {
    //         return this.getByLocation(zoom, location);
    //     }));

    //     return new TransitTileSet(tiles);
    // }

    // public async getMultipleByTileCoords(coordinates: RoutableTileCoordinate[]): Promise<TransitTileSet> {
    //     const tiles = await Promise.all(coordinates.map((coordinate) => {
    //         return this.getByTileCoords(coordinate);
    //     }));

    //     return new TransitTileSet(tiles);
    //}

    public async fetchCorrectTile(node: RoutableTileNode, local?: boolean) {
        if (local) {
            //geef de URL naar de routable tile terug, zal afhangen van wat keuze is
            return await this.getByUrl(await this.traverseRoutableTree(node));
        }
        else {
            return await this.getByUrl(await this.traverseTransitTree(node));
        }
    }

    public async traverseTransitTree(node: ILocation) {

        let tile: TransitTile;
        let newTile: TransitTile;

        tile = await this.getMetaByUrl(this.transitRoot);

        while (tile.getArea().contains(this.localNodes[0]) || tile.getArea().contains(this.localNodes[1])) {
           
            for (const rel of tile.getRelations()) {
                if (rel.geoValue.contains(node)) {
                    newTile = await this.getMetaByUrl(rel.id);
                }
            }

            if (tile.coordinate.x == newTile.coordinate.x && tile.coordinate.y === newTile.coordinate.y && tile.coordinate.zoom === newTile.coordinate.zoom) {
                break;
            }

            if(newTile){
                tile = newTile;
            }
            else{
                return null;
            }
        }
        return tile.id;
    }


    public async traverseRoutableTree(node: ILocation){
        let tile: RoutableTile;
        let newTile: RoutableTile;

        tile = await this.getRoutableMetaByUrl(this.routableRoot);

        while(tile.getRelations().size > 0){
            for (const rel of tile.getRelations()) {
                if (rel.geoValue.contains(node)) {
                    newTile = await this.getRoutableMetaByUrl(rel.id);
                }
            }
            if(newTile){
                tile = newTile;
            }
            else{
                return null;
            }
        }
        return tile.id;
    }



    public getTileFromCache(id: string){
        return this.tiles[id];
    }




    private long2tile(lon: number, zoom: number) {
        return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
    }

    private lat2tile(lat: number, zoom: number) {
        return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1
            / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
    }

}