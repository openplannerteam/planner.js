import { AsyncIterator } from "asynciterator";
import { IConnectionsSourceConfig } from "../../Catalog";
import IConnection from "../../entities/connections/connections";
import { LinkedConnectionsPage } from "../../entities/connections/page";
import { ConnectionsFetcherFactory } from "../../types";
import IHydraTemplateFetcher from "../hydra/IHydraTemplateFetcher";
import IConnectionsIteratorOptions from "./IConnectionsIteratorOptions";
import IConnectionsProvider from "./IConnectionsProvider";
export default class ConnectionsProviderDefault implements IConnectionsProvider {
    private sources;
    private singleProviders;
    private connectionsFetcherFactory;
    private templateFetcher;
    constructor(connectionsFetcherFactory: ConnectionsFetcherFactory, templateFetcher: IHydraTemplateFetcher);
    addConnectionSource(source: IConnectionsSourceConfig): void;
    getSources(): IConnectionsSourceConfig[];
    prefetchConnections(lowerBound: Date, upperBound: Date): void;
    createIterator(options: IConnectionsIteratorOptions): Promise<AsyncIterator<IConnection>>;
    appendIterator(options: IConnectionsIteratorOptions, existingIterator: AsyncIterator<IConnection>): Promise<AsyncIterator<IConnection>>;
    getByUrl(url: string): Promise<LinkedConnectionsPage>;
    getByTime(date: Date): Promise<LinkedConnectionsPage>;
}
