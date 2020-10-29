import { AsyncIterator } from "asynciterator";
import { IConnectionsSourceConfig } from "../../Catalog";
import IConnection from "../../entities/connections/connections";
import { LinkedConnectionsPage } from "../../entities/connections/page";
import GeometryValue from "../../entities/tree/geometry";
import IConnectionsIteratorOptions from "./IConnectionsIteratorOptions";
export default interface IConnectionsProvider {
    addConnectionSource(source: IConnectionsSourceConfig): any;
    getSources(): IConnectionsSourceConfig[];
    prefetchConnections(lowerBound: Date, upperBound: Date): void;
    appendIterator(options: IConnectionsIteratorOptions, existingIterator: AsyncIterator<IConnection>): Promise<AsyncIterator<IConnection>>;
    createIterator(options: IConnectionsIteratorOptions): Promise<AsyncIterator<IConnection>>;
    getByUrl(url: string): Promise<LinkedConnectionsPage>;
    getByTime(date: Date, region?: GeometryValue): Promise<LinkedConnectionsPage>;
}
