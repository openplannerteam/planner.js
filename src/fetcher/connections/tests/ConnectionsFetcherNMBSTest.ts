import { ArrayIterator, AsyncIterator } from "asynciterator";
import { injectable } from "inversify";
import IConnection from "../IConnection";
import IConnectionsFetcher from "../IConnectionsFetcher";
import IConnectionsFetcherConfig from "../IConnectionsFetcherConfig";

@injectable()
export default class ConnectionsFetcherNMBSTest implements IConnectionsFetcher {

  private connections: Array<IteratorResult<IConnection>> = [];
  private config: IConnectionsFetcherConfig = {};

  constructor(connections: Array<IteratorResult<IConnection>>) {
      this.connections = connections;
  }

  public prefetchConnections(): void {
    return;
  }

  public setConfig(config: IConnectionsFetcherConfig): void {
    this.config = config;
  }

  public createIterator(): AsyncIterator<IConnection> {
    let array = this.connections
      .map((r) => r.value);

    if (this.config.backward) {
      array = array.reverse();
    }

    return new ArrayIterator(array);
  }
}
