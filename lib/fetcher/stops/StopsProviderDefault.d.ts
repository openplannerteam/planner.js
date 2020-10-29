import { IStopsSourceConfig } from "../../Catalog";
import { StopsFetcherFactory } from "../../types";
import IStop from "./IStop";
import IStopsProvider from "./IStopsProvider";
export default class StopsProviderDefault implements IStopsProvider {
    private readonly stopsFetchers;
    private cachedStops;
    private allStops;
    private stopsFetcherFactory;
    private sources;
    constructor(stopsFetcherFactory: StopsFetcherFactory);
    addStopSource(source: IStopsSourceConfig): void;
    getSources(): IStopsSourceConfig[];
    prefetchStops(): void;
    getStopById(stopId: string): Promise<IStop>;
    getAllStops(): Promise<IStop[]>;
}
