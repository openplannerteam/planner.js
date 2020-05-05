import { injectable, inject } from "inversify";
import { TransitTileSet } from "../../entities/tiles/set";
import ITransitTileProvider from "./ISmartTileProvider";
import ITransitTileFetcher from "./ITransitTileFetcher";
import RoutableTileRegistry from "../../entities/tiles/registry";
import { ITransitTileIndex, TransitTile, IRoutableTileIndex } from "../../entities/tiles/tile";
import ILocation from "../../interfaces/ILocation";
import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";
import { lat_to_tile, long_to_tile } from "../../util/Tiles";
import TYPES from "../../types";
import { RoutableTileNode } from "../../entities/tiles/node";
import { EventEmitter } from "events";
import EventBus from "../../events/EventBus";
import EventType from "../../events/EventType";
import IRoutableTileFetcher from "./IRoutableTileFetcher";

@injectable()
export default class TransitTileProviderDefault implements ITransitTileProvider {

    protected fetcher: ITransitTileFetcher;
    protected baseFetcher: IRoutableTileFetcher;
    protected registry: RoutableTileRegistry;
    protected tiles: ITransitTileIndex = {};
    protected baseTiles: IRoutableTileIndex = {};
    private localNodes: ILocation[];
    private transitRoot: string = "http://192.168.56.1:8080/tiles/car/transit_geo/0/0.json";
    private routableRoot: string = "https://tiles.openplannerteam/planet/"
    private eventBus: EventEmitter;

    constructor(
        @inject(TYPES.TransitTileFetcher) fetcher: ITransitTileFetcher,
        @inject(TYPES.RoutableTileFetcher) baseFetcher: IRoutableTileFetcher,
    ) {
        this.fetcher = fetcher;
        this.baseFetcher = baseFetcher;
        this.registry = RoutableTileRegistry.getInstance();
        this.eventBus = EventBus.getInstance();
    }

    //not sure what this does
    public async wait() {
        await Promise.all(Object.values(this.tiles));
    }

    public addLocalNodes(nodes: ILocation[]) {
        this.localNodes = nodes;
        for(const node of this.localNodes){
        console.log(node.id + " " + node.longitude + " " + node.latitude);
        //this.eventBus.emit(EventType.AddLocalNode, node);
        }
    }

    public getIdForLocation(zoom: number, location: ILocation, local?: boolean): string {
        const y = lat_to_tile(location.latitude, zoom);
        const x = long_to_tile(location.longitude, zoom);
        const coordinate = new RoutableTileCoordinate(zoom, x, y);
        return this.getIdForTileCoords(coordinate, local);
    }

    //this URL is hardcoded to my own (local) fileserver with transit tile data, + points to blabla.json
    public getIdForTileCoords(coordinate: RoutableTileCoordinate, local?: boolean): string {
        //return `https://hdelva.be/tiles/transit/${coordinate.zoom}/${coordinate.x}/${coordinate.y}`;

        if(local){
            return `https://tiles.openplanner.team/planet/${coordinate.zoom}/${coordinate.x}/${coordinate.y}`;
        }
        return `http://192.168.56.1:8080/car/transit_geo/${coordinate.zoom}/${coordinate.x}/${coordinate.y}.json`;
    }

    public getByLocation(zoom: number, location: ILocation): Promise<TransitTile> {
        const y = this.lat2tile(location.latitude, zoom);
        const x = this.long2tile(location.longitude, zoom);
        const coordinate = new RoutableTileCoordinate(zoom, x, y);
        return this.getByTileCoords(coordinate);
    }

    public async getByTileCoords(coordinate: RoutableTileCoordinate): Promise<TransitTile> {
        const url = this.getIdForTileCoords(coordinate);
        const tile = await this.getByUrl(url);
        tile.coordinate = coordinate;  // todo, get these from server response -> ?
        return tile;
    }

    public async getByUrl(url: string, routable?: boolean): Promise<TransitTile> {
        if (!this.tiles[url]) {
            this.tiles[url] = this.fetcher.get(url);
        }

        return await this.tiles[url];
    }

    public async getMultipleByUrl(urls: string[]): Promise<TransitTileSet> {
        const tiles = await Promise.all(urls.map((url) => {
            return this.getByUrl(url);
        }));

        return new TransitTileSet(tiles);
    }

    public async getmultipleByLocation(zoom: number, locations: ILocation[]): Promise<TransitTileSet> {
        const tiles = await Promise.all(locations.map((location) => {
            return this.getByLocation(zoom, location);
        }));

        return new TransitTileSet(tiles);
    }

    public async getMultipleByTileCoords(coordinates: RoutableTileCoordinate[]): Promise<TransitTileSet> {
        const tiles = await Promise.all(coordinates.map((coordinate) => {
            return this.getByTileCoords(coordinate);
        }));

        return new TransitTileSet(tiles);
    }

    public async fetchCorrectTile(node: RoutableTileNode, local?: boolean) {
        if (local) {
            //geef de URL naar de routable tile terug, zal afhangen van wat keuze is
            return await this.getByUrl(this.getIdForLocation(14, node, true));
        }
        else {
            return await this.getByUrl(await this.traverseTransitTree(node));
        }
    }

    public async traverseTransitTree(node: ILocation) {

        let tile: TransitTile;
        let newTile: TransitTile;

        tile = await this.getByUrl(this.transitRoot);

        while (tile.getArea().contains(this.localNodes[0]) || tile.getArea().contains(this.localNodes[1])) {
           
            for (const rel of tile.getRelations()) {
                if (rel.geoValue.contains(node)) {
                    newTile = await this.getByUrl(rel.id);
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
        //eens je uit de while loop komt heb je ofwel een transitTile op een niveau < 14 die geen start of eindpunt bevat maar wel de node zelf,
        //of heb je een routableTile van op niveau 14  indien er nog een laatste relatie zit naar de overeenkomstige routable tile zelf dan

        //interessant om de id mee te geven als je hier toch al de tile zelf gefetcht hebt? maakt wss niet veel uit aangezien hij al zal gecached zijn dus gwn lokaal ophalen
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