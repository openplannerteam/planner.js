import { injectable } from "inversify";
import IConnection from "../IConnection";
import IConnectionsFetcherConfig from "../IConnectionsFetcherConfig";

@injectable()
export default class ConnectionsFetcherNMBSTest implements AsyncIterator<IConnection> {

  private connections: Array<IteratorResult<IConnection>> = [];
  private config: IConnectionsFetcherConfig = {};
  private connectionIndex;

  constructor(connections: Array<IteratorResult<IConnection>>) {
      this.connections = connections;
  }

  public [Symbol.asyncIterator](): AsyncIterator<IConnection> {
    return this.fetch();
  }

  public setConfig(config: IConnectionsFetcherConfig): void {
    this.config = config;

    if (!this.config.backward) {
      this.connectionIndex = 0;
    } else {
      this.connectionIndex = this.connections.length - 1;
    }
  }

  public fetch(): AsyncIterator<IConnection> {
    return this;
  }

  public async next(): Promise<IteratorResult<IConnection>> {
    const nextConnection = this.connections[this.connectionIndex];
    if (!this.config.backward) {
      if (this.connectionIndex === this.connections.length - 1) {
        nextConnection.done = true;
      } else {
        this.connectionIndex++;
      }

    } else {
      if (this.connectionIndex === 0) {
        nextConnection.done = true;
      } else {
        this.connectionIndex--;
      }
    }
    return nextConnection;
  }

  public async return(value?: any): Promise<IteratorResult<IConnection>> {
    return undefined;
  }

  public async throw(e?: any): Promise<IteratorResult<IConnection>> {
    return undefined;
  }
}
