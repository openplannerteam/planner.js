import { AsyncIterator } from "asynciterator";
import { IConnectionsSourceConfig } from "../../../Catalog";
import IConnection from "../../../entities/connections/connections";
import { LinkedConnectionsPage } from "../../../entities/connections/page";
import IConnectionsIteratorOptions from "../IConnectionsIteratorOptions";
import IConnectionsProvider from "../IConnectionsProvider";
export default class ConnectionsProviderNMBSTest implements IConnectionsProvider {
    private connections;
    private s;
    constructor(connections: Array<IteratorResult<IConnection>>);
    getSources(): IConnectionsSourceConfig[];
    appendIterator(options: IConnectionsIteratorOptions, existingIterator: AsyncIterator<IConnection>): Promise<AsyncIterator<IConnection>>;
    addConnectionSource(source: IConnectionsSourceConfig): void;
    getByUrl(url: string): Promise<LinkedConnectionsPage>;
    getByTime(date: Date): Promise<LinkedConnectionsPage>;
    prefetchConnections(): void;
    createIterator(options: IConnectionsIteratorOptions): Promise<AsyncIterator<IConnection>>;
}
