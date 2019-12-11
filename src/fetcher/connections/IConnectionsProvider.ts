import { AsyncIterator } from "asynciterator";
import IConnection from "../../entities/connections/connections";
import { LinkedConnectionsPage } from "../../entities/connections/page";
import TravelMode from "../../enums/TravelMode";
import IConnectionsIteratorOptions from "./IConnectionsIteratorOptions";

export default interface IConnectionsProvider {
  prefetchConnections(lowerBound: Date, upperBound: Date): void;
  createIterator(options: IConnectionsIteratorOptions): Promise<AsyncIterator<IConnection>>;

  getByUrl(url: string): Promise<LinkedConnectionsPage>;

  getByTime(date: Date): Promise<LinkedConnectionsPage>;
}
