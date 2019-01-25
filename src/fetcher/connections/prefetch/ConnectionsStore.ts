import { ArrayIterator, AsyncIterator, IntegerIterator, IntegerIteratorOptions } from "asynciterator";
import BinarySearch from "../../../util/BinarySearch";
import IConnection from "../IConnection";
import IConnectionsIteratorOptions from "../IConnectionsIteratorOptions";

interface IDeferredBackwardView {
  lowerBoundDate: Date;
  upperBoundDate: Date;
  resolve: (iterator: AsyncIterator<IConnection>) => void;
}

/**
 * Class used while prefetching [[IConnection]] instances. It allows appending connections
 * and creating iterator *views*. Iterator *views* are AsyncIterators that emit references to connections in the store.
 *
 * It is assumed that all connections are appended in ascending order by `departureTime`.
 *
 * Consequently this connections store serves as an in-memory cache for connections
 */
export default class ConnectionsStore {
  private readonly store: IConnection[];
  private readonly binarySearch: BinarySearch<IConnection>;
  private deferredBackwardViews: IDeferredBackwardView[];
  private hasFinished: boolean;

  constructor() {
    this.store = [];
    this.binarySearch = new BinarySearch<IConnection>(this.store, (connection) => connection.departureTime.valueOf());
    this.deferredBackwardViews = [];
    this.hasFinished = false;
  }

  /**
   * Add a new [[IConnection]] to the store.
   *
   * Additionally, this method checks if any forward iterator views can be pushed to or if any backward iterator can be
   * resolved
   */
  public append(connection: IConnection) {
    this.store.push(connection);

    // Check if any deferred backward view are satisfied
    if (this.deferredBackwardViews.length) {
      this.deferredBackwardViews = this.deferredBackwardViews
        .filter(({ lowerBoundDate, upperBoundDate, resolve }) => {

          if (connection.departureTime > upperBoundDate) {
            const iteratorView = this.getIteratorView(true, lowerBoundDate, upperBoundDate);

            resolve(iteratorView);
            return false;
          }

          return true;
        });
    }
  }

  /**
   * Signals that the store will no longer be appended.
   * [[getIterator]] never returns a deferred backward view after this, because those would never get resolved
   */
  public finish(): void {
    this.hasFinished = true;
  }

  public getIterator(iteratorOptions: IConnectionsIteratorOptions): Promise<AsyncIterator<IConnection>> {
    const { backward } = iteratorOptions;
    let { lowerBoundDate, upperBoundDate } = iteratorOptions;

    if (this.hasFinished && this.store.length === 0) {
      return Promise.resolve(new ArrayIterator([]));
    }

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
    if (!this.hasFinished && (!lastDepartureTime || lastDepartureTime <= upperBoundDate)) {
      const { deferred, promise } = this.createDeferredBackwardView(lowerBoundDate, upperBoundDate);

      this.deferredBackwardViews.push(deferred);

      return promise;
    }

    // Else if the whole interval is available, or the store has finished, return an iterator immediately
    return Promise.resolve(this.getIteratorView(backward, lowerBoundDate, upperBoundDate));
  }

  private createDeferredBackwardView(lowerBoundDate, upperBoundDate):
    { deferred: IDeferredBackwardView, promise: Promise<AsyncIterator<IConnection>> } {

    const deferred: Partial<IDeferredBackwardView> = {
      lowerBoundDate,
      upperBoundDate,
    };

    const promise = new Promise<AsyncIterator<IConnection>>((resolve) => {
      deferred.resolve = resolve;
    });

    return {
      deferred: deferred as IDeferredBackwardView,
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
