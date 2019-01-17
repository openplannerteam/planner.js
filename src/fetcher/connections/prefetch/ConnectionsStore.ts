import { AsyncIterator, IntegerIterator, IntegerIteratorOptions } from "asynciterator";
import BinarySearch from "../../../util/BinarySearch";
import IConnection from "../IConnection";
import IConnectionsFetcherConfig from "../IConnectionsFetcherConfig";

interface IBackwardPromise {
  lowerBoundDate: Date;
  upperBoundDate: Date;
  resolve: (iterator: AsyncIterator<IConnection>) => void;
}

export default class ConnectionsStore {
  private readonly store: IConnection[];
  private backwardPromises: IBackwardPromise[];

  constructor() {
    this.store = [];
    this.backwardPromises = [];
  }

  public append(connection: IConnection) {
    this.store.push(connection);

    // Check if any backward promises are satisfied
    if (this.backwardPromises.length) {
      this.backwardPromises = this.backwardPromises
        .filter(({ lowerBoundDate, upperBoundDate, resolve }) => {

          if (connection.departureTime > upperBoundDate) {
            const iteratorView = this.getBackwardIterator(lowerBoundDate, upperBoundDate);

            resolve(iteratorView);
            return false;
          }

          return true;
        });
    }
  }

  public getIteratorView(fetcherConfig: IConnectionsFetcherConfig): Promise<AsyncIterator<IConnection>> {
    const { lowerBoundDate, upperBoundDate, backward } = fetcherConfig;

    if (!backward) {
      throw new Error("Forward is not yet supported");
    }

    if (backward && upperBoundDate) {
      const lastConnection = this.store[this.store.length - 1];
      const lastDepartureTime = lastConnection && lastConnection.departureTime;

      // If the store is still empty or the latest departure time isn't later than the upperBoundDate,
      // then return a promise
      if (!lastDepartureTime || lastDepartureTime <= upperBoundDate) {
        const backwardPromise: Partial<IBackwardPromise> = {
          lowerBoundDate,
          upperBoundDate,
        };

        const promise = new Promise<AsyncIterator<IConnection>>((resolve, reject) => {
          backwardPromise.resolve = resolve;
        });

        this.backwardPromises.push(backwardPromise as IBackwardPromise);

        return promise;
      }

      // Else if the whole interval is available, return an iterator immediately
      return Promise.resolve(this.getBackwardIterator(lowerBoundDate, upperBoundDate));
    }
  }

  private getBackwardIterator(lowerBoundDate, upperBoundDate): AsyncIterator<IConnection> {
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

  private getUpperBoundIndex(date: Date): number {
    const binarySearch = new BinarySearch<IConnection>(this.store, (connection) => connection.departureTime.valueOf());

    return binarySearch.findLastIndex(date.valueOf(), 0, this.store.length - 1);
  }
}
