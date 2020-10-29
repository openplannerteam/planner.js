/// <reference types="node" />
import { ZoiTile } from "../../entities/tiles/ZoiTile";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import IZoiTileFetcher from "./IZoiTileFetcherRaw";
import { EventEmitter } from "events";
export default class ZoiTileFetcherRaw implements IZoiTileFetcher {
    protected mapping: object;
    protected pathfinderProvider: PathfinderProvider;
    protected eventBus: EventEmitter;
    constructor();
    get(url: string): Promise<ZoiTile>;
    protected parseResponseLength(response: any): number;
    private createSubject;
    private createProperty;
    private createZone;
}
