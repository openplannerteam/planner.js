import { AsyncIterator, IntegerIterator, IntegerIteratorOptions } from "asynciterator";
import BinarySearch from "../../../util/BinarySearch";
import IConnection from "../IConnection";
import IConnectionsFetcherConfig from "../IConnectionsFetcherConfig";

interface IViewPromise {
  backward: boolean;
  lowerBoundDate: Date;
  upperBoundDate: Date;
  resolve: (iterator: AsyncIterator<IConnection>) => void;
}

export default class ConnectionsStore {
  private readonly store: IConnection[];
  private readonly binarySearch: BinarySearch<IConnection>;
  private viewPromises: IViewPromise[];

  constructor() {
    this.store = [];
    this.binarySearch = new BinarySearch<IConnection>(this.store, (connection) => connection.departureTime.valueOf());
    this.viewPromises = [];
  }

  public append(connection: IConnection) {
    this.store.push(connection);

    // Check if any view promises are satisfied
    if (this.viewPromises.length) {
      this.viewPromises = this.viewPromises
        .filter(({ backward, lowerBoundDate, upperBoundDate, resolve }) => {

          if (connection.departureTime > upperBoundDate) {
            const iteratorView = this.getIteratorView(backward, lowerBoundDate, upperBoundDate);

            resolve(iteratorView);
            return false;
          }

          return true;
        });
    }
  }

  public getIterator(fetcherConfig: IConnectionsFetcherConfig): Promise<AsyncIterator<IConnection>> {
    const { backward } = fetcherConfig;
    let { lowerBoundDate, upperBoundDate } = fetcherConfig;

    const firstConnection = this.store[0];
    const firstDepartureTime = firstConnection && firstConnection.departureTime;

    const lastConnection = this.store[this.store.length - 1];
    const lastDepartureTime = lastConnection && lastConnection.departureTime;

    if (!backward) {
      if (!lowerBoundDate) {
        throw new Error("Must supply lowerBoundDate when iterating forward");
      }

      if (!upperBoundDate) {
        upperBoundDate = lastDepartureTime;
      }
    }

    if (backward) {
      if (!upperBoundDate) {
        throw new Error("Must supply upperBoundDate when iterating backward");
      }

      if (!lowerBoundDate) {
        lowerBoundDate = firstDepartureTime;
      }
    }

    // If the store is still empty or the latest departure time isn't later than the upperBoundDate,
    // then return a promise
    if (!lastDepartureTime || lastDepartureTime <= upperBoundDate) {
      const { viewPromise, promise } = this.createViewPromise(backward, lowerBoundDate, upperBoundDate);

      this.viewPromises.push(viewPromise);

      return promise;
    }

    // Else if the whole interval is available, return an iterator immediately
    return Promise.resolve(this.getIteratorView(backward, lowerBoundDate, upperBoundDate));
  }

  private createViewPromise(backward, lowerBoundDate, upperBoundDate):
    { viewPromise: IViewPromise, promise: Promise<AsyncIterator<IConnection>> } {

    const viewPromise: Partial<IViewPromise> = {
      backward,
      lowerBoundDate,
      upperBoundDate,
    };

    const promise = new Promise<AsyncIterator<IConnection>>((resolve) => {
      viewPromise.resolve = resolve;
    });

    return {
      viewPromise: viewPromise as IViewPromise,
      promise,
    };
  }

  private getIteratorView(backward: boolean, lowerBoundDate: Date, upperBoundDate: Date): AsyncIterator<IConnection> {
    const lowerBoundIndex = this.getLowerBoundIndex(lowerBoundDate);
    const upperBoundIndex = this.getUpperBoundIndex(upperBoundDate);

    const indexIteratorOptions: IntegerIteratorOptions = {
      start: backward ? upperBoundIndex : lowerBoundIndex,
      end: backward ? lowerBoundIndex : upperBoundIndex,
      step: backward ? -1 : 1,
    };

    return new IntegerIterator(indexIteratorOptions)
      .map((index) => this.store[index]);
  }

  private getLowerBoundIndex(date: Date): number {
    return this.binarySearch.findFirstIndex(date.valueOf(), 0, this.store.length - 1);
  }

  private getUpperBoundIndex(date: Date): number {
    return this.binarySearch.findLastIndex(date.valueOf(), 0, this.store.length - 1);
  }
}
