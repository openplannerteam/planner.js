import IConnection from "../IConnection";
import IConnectionsFetcherConfig from "../IConnectionsFetcherConfig";

export default class ConnectionsIteratorMerge implements AsyncIterator<IConnection> {

  private iterators: Array<AsyncIterator<IConnection>>;
  private config: IConnectionsFetcherConfig;

  private nextConnections: IConnection[];

  constructor(iterators: Array<AsyncIterator<IConnection>>, config: IConnectionsFetcherConfig) {
    this.iterators = iterators;
    this.config = config;

    this.nextConnections = Array(iterators.length);
  }

  public async next(): Promise<IteratorResult<IConnection>> {
    await this.replenishNextConnections();

    // console.log("Next connections", this.nextConnections.map((c) => `${c.departureTime} ${c["@id"]}`));

    if (!this.config.backward) {
      // Get next connection with earliest departure time

      const earliestConnection = this.findNextConnection(this.earliestPredicate);
      return {value: earliestConnection, done: false};

    } else {
      // Get next connection with latest departure time

      const latestConnection = this.findNextConnection(this.latestPredicate);
      return {value: latestConnection, done: false};
    }
  }

  public return(value?: any): Promise<IteratorResult<IConnection>> {
    return undefined;
  }

  public throw(e?: any): Promise<IteratorResult<IConnection>> {
    return undefined;
  }

  private findNextConnection(predicate: (matching: IConnection, current: IConnection) => boolean): IConnection {
    let matchingConnectionIndex = 0;
    let matchingConnection = this.nextConnections[matchingConnectionIndex];

    for (let i = 1; i < this.nextConnections.length; i++) {
      const currentConnection = this.nextConnections[i];

      if (predicate(matchingConnection, currentConnection)) {
        matchingConnectionIndex = i;
        matchingConnection = currentConnection;
      }
    }

    this.nextConnections[matchingConnectionIndex] = null;
    return matchingConnection;
  }

  private earliestPredicate(matching: IConnection, current: IConnection): boolean {
    return matching.departureTime.valueOf() > current.departureTime.valueOf();
  }

  private latestPredicate(matching: IConnection, current: IConnection): boolean {
    return matching.departureTime.valueOf() < current.departureTime.valueOf();
  }

  private async replenishNextConnections() {
    for (let i = 0; i < this.nextConnections.length; i++) {
      if (!this.nextConnections[i]) {
        const result = await this.iterators[i].next();
        this.nextConnections[i] = result.value;
      }
    }
  }

}
