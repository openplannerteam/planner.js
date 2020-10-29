import { AsyncIterator } from "asynciterator";
import { IConnectionsSourceConfig } from "../../Catalog";
import IConnection from "../../entities/connections/connections";
import { ILinkedConnectionsPageIndex, LinkedConnectionsPage } from "../../entities/connections/page";
import { HydraTemplate } from "../../entities/hydra/search";
import GeometryValue from "../../entities/tree/geometry";
import { ConnectionsFetcherFactory } from "../../types";
import IHydraTemplateFetcher from "../hydra/IHydraTemplateFetcher";
import IConnectionsFetcher from "./IConnectionsFetcher";
import IConnectionsIteratorOptions from "./IConnectionsIteratorOptions";
import IConnectionsProvider from "./IConnectionsProvider";
export default class ConnectionsProviderSingle implements IConnectionsProvider {
    protected fetcher: IConnectionsFetcher;
    protected templateFetcher: IHydraTemplateFetcher;
    protected pages: ILinkedConnectionsPageIndex;
    protected source: IConnectionsSourceConfig;
    protected template: Promise<HydraTemplate>;
    constructor(connectionsFetcherFactory: ConnectionsFetcherFactory, catalog: IConnectionsSourceConfig, templateFetcher: IHydraTemplateFetcher);
    addConnectionSource(source: IConnectionsSourceConfig): void;
    getSources(): IConnectionsSourceConfig[];
    getByUrl(url: string): Promise<LinkedConnectionsPage>;
    getByTime(date: Date, region?: GeometryValue): Promise<LinkedConnectionsPage>;
    getIdForTime(date: Date, region?: GeometryValue): Promise<string>;
    prefetchConnections(lowerBound: Date, upperBound: Date): void;
    appendIterator(options: IConnectionsIteratorOptions, existingIterator: AsyncIterator<IConnection>): Promise<AsyncIterator<IConnection>>;
    createIterator(options: IConnectionsIteratorOptions): Promise<AsyncIterator<IConnection>>;
    protected getTemplate(): Promise<HydraTemplate>;
}
