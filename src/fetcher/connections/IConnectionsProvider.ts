import { AsyncIterator } from "asynciterator";
import { IConnectionsSourceConfig } from "../../Catalog";
import IConnection from "../../entities/connections/connections";
import { LinkedConnectionsPage } from "../../entities/connections/page";
import IConnectionsIteratorOptions from "./IConnectionsIteratorOptions";

export default interface IConnectionsProvider {
  addConnectionSource(source: IConnectionsSourceConfig);

  prefetchConnections(lowerBound: Date, upperBound: Date): void;
  createIterator(options: IConnectionsIteratorOptions): Promise<AsyncIterator<IConnection>>;

  getByUrl(url: string): Promise<LinkedConnectionsPage>;
  getByTime(date: Date): Promise<LinkedConnectionsPage>;
}
