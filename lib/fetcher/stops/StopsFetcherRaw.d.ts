import LDFetch from "ldfetch";
import { IStopsSourceConfig } from "../../Catalog";
import IStop from "./IStop";
import IStopsFetcher from "./IStopsFetcher";
export default class StopsFetcherRaw implements IStopsFetcher {
    private accessUrl;
    private ldFetch;
    private loadPromise;
    private stops;
    constructor(ldFetch: LDFetch);
    addStopSource(source: IStopsSourceConfig): void;
    getSources(): IStopsSourceConfig[];
    setAccessUrl(accessUrl: string): void;
    prefetchStops(): void;
    getStopById(stopId: string): Promise<IStop>;
    getAllStops(): Promise<IStop[]>;
    private ensureStopsLoaded;
    private loadStops;
    private getByUrl;
    private parseResponseLength;
}
