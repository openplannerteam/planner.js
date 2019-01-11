import { AsyncIterator, IntegerIterator, IntegerIteratorOptions } from "asynciterator";
import BinarySearch from "../../../util/BinarySearch";
import IConnection from "../IConnection";
import IConnectionsFetcherConfig from "../IConnectionsFetcherConfig";

// let lastDepartureTime;

export default class ConnectionsStore {
  private readonly store: IConnection[];

  constructor() {
    this.store = [];
  }

  public append(connection: IConnection) {
    // if (!lastDepartureTime) {
    //   lastDepartureTime = connection.departureTime;
    // }

    // if (connection.departureTime > lastDepartureTime) {
    //   console.log(connection.departureTime);
    //   lastDepartureTime = connection.departureTime;
    // }

    this.store.push(connection);
  }

  public getIteratorView(fetcherConfig: IConnectionsFetcherConfig): AsyncIterator<IConnection> {
    const {lowerBoundDate, upperBoundDate, backward} = fetcherConfig;

    if (backward && upperBoundDate) {
      const upperBoundIndex = this.getUpperBoundIndex(upperBoundDate);
      const lowerBoundIndex = 0;

      const indexIteratorOptions: IntegerIteratorOptions = {
        start: upperBoundIndex,
        end: lowerBoundIndex,
        step: -1,
      };

      return new IntegerIterator(indexIteratorOptions)
        .map((index) => this.store[index]);
    }
  }

  private getUpperBoundIndex(date: Date): number {
    const binarySearch = new BinarySearch<IConnection>(this.store, (connection) => connection.departureTime.valueOf());

    return binarySearch.findLastIndex(date.valueOf(), 0, this.store.length - 1);
  }
}
