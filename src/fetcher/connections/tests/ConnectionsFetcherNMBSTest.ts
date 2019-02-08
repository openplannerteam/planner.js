import { ArrayIterator, AsyncIterator } from "asynciterator";
import { injectable } from "inversify";
import IConnection from "../IConnection";
import IConnectionsFetcher from "../IConnectionsFetcher";
import IConnectionsIteratorOptions from "../IConnectionsIteratorOptions";

@injectable()
export default class ConnectionsFetcherNMBSTest implements IConnectionsFetcher {

  private connections: Array<IteratorResult<IConnection>> = [];
  private options: IConnectionsIteratorOptions = {};

  constructor(connections: Array<IteratorResult<IConnection>>) {
      this.connections = connections;
  }

  public prefetchConnections(): void {
    return;
  }

  public setIteratorOptions(options: IConnectionsIteratorOptions): void {
    this.options = options;
  }

  public createIterator(): AsyncIterator<IConnection> {
    let array = this.connections
      .map((r) => r.value);

    if (this.options.backward) {
      array = array.reverse();
    }

    return new ArrayIterator(array);
  }
}
