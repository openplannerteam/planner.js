import { ArrayIterator, AsyncIterator, IntegerIterator, IntegerIteratorOptions } from "asynciterator";
import { PromiseProxyIterator } from "asynciterator-promiseproxy";
import Context from "../../../Context";
import EventType from "../../../enums/EventType";
import BinarySearch from "../../../util/BinarySearch";
import IConnection from "../IConnection";
import IConnectionsIteratorOptions from "../IConnectionsIteratorOptions";
import ExpandingIterator from "./ExpandingIterator";

interface IDeferredBackwardView {
  lowerBoundDate: Date;
  upperBoundDate: Date;
  resolve: (iterator: AsyncIterator<IConnection>) => void;
}

interface IExpandingForwardView {
  lowerBoundDate: Date;
  upperBoundDate: Date;
  tryExpand: (connection: IConnection, index: number) => boolean;
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

  private readonly context: Context;
  private readonly store: IConnection[];
  private readonly binarySearch: BinarySearch<IConnection>;
  private deferredBackwardViews: IDeferredBackwardView[];
  private expandingForwardViews: IExpandingForwardView[];
  private hasFinished: boolean;

  constructor(context?: Context) {
    this.context = context;
    this.store = [];
    this.binarySearch = new BinarySearch<IConnection>(this.store, (connection) => connection.departureTime.valueOf());
    this.deferredBackwardViews = [];
    this.expandingForwardViews = [];
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

    // Check if any deferred backward views are satisfied
    if (this.deferredBackwardViews.length) {
      this.deferredBackwardViews = this.deferredBackwardViews
        .filter(({ lowerBoundDate, upperBoundDate, resolve }) => {

          if (connection.departureTime > upperBoundDate) {
            const { iterator } = this.getIteratorView(true, lowerBoundDate, upperBoundDate);

            if (this.context) {
              this.context.emit(EventType.ConnectionIteratorView, lowerBoundDate, upperBoundDate, true);
            }

            resolve(iterator);
            return false;
          }

          return true;
        });
    }

    // Check if any forward views can be expanded
    if (this.expandingForwardViews.length) {
      this.expandingForwardViews = this.expandingForwardViews
        .filter(({ tryExpand }) =>
          tryExpand(connection, this.store.length - 1),
        );
    }
  }

  /**
   * Signals that the store will no longer be appended.
   * [[getIterator]] never returns a deferred backward view after this, because those would never get resolved
   */
  public finish(): void {
    this.hasFinished = true;
  }

  public getIterator(iteratorOptions: IConnectionsIteratorOptions): AsyncIterator<IConnection> {
    const { backward } = iteratorOptions;
    let { lowerBoundDate, upperBoundDate } = iteratorOptions;

    if (this.context) {
      this.context.emit(EventType.ConnectionIteratorView, lowerBoundDate, upperBoundDate, false);
    }

    if (this.hasFinished && this.store.length === 0) {
      return new ArrayIterator([]);
    }

    const firstConnection = this.store[0];
    const firstDepartureTime = firstConnection && firstConnection.departureTime;

    const lastConnection = this.store[this.store.length - 1];
    const lastDepartureTime = lastConnection && lastConnection.departureTime;

    if (backward) {

      if (!upperBoundDate) {
        throw new Error("Must supply upperBoundDate when iterating backward");
      }

      if (!lowerBoundDate) {
        lowerBoundDate = firstDepartureTime;
      }

      // If the store is still empty or the latest departure time isn't later than the upperBoundDate,
      // then return a promise proxy iterator
      if (!this.hasFinished && (!lastDepartureTime || lastDepartureTime <= upperBoundDate)) {
        const { deferred, promise } = this.createDeferredBackwardView(lowerBoundDate, upperBoundDate);

        this.deferredBackwardViews.push(deferred);

        return new PromiseProxyIterator(() => promise);
      }

    } else {

      if (!lowerBoundDate) {
        throw new Error("Must supply lowerBoundDate when iterating forward");
      }

      if (!upperBoundDate) {
        upperBoundDate = lastDepartureTime;
      }

      // If the store is still empty or the latest departure time isn't later than the upperBoundDate,
      // then return a an expanding iterator view
      if (!this.hasFinished && (!lastDepartureTime || lastDepartureTime <= upperBoundDate)) {
        const { view, iterator } = this.createExpandingForwardView(lowerBoundDate, upperBoundDate);

        this.expandingForwardViews.push(view);

        return iterator;
      }
    }

    // Else if the whole interval is available, or the store has finished, return an iterator immediately
    const { iterator } = this.getIteratorView(backward, lowerBoundDate, upperBoundDate);

    if (this.context) {
      this.context.emit(EventType.ConnectionIteratorView, lowerBoundDate, upperBoundDate, true);
    }

    return iterator;
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

  private createExpandingForwardView(lowerBoundDate, upperBoundDate):
    { view: IExpandingForwardView, iterator: AsyncIterator<IConnection> } {

    const { iterator: existingIterator, upperBoundIndex } = this.getIteratorView(false, lowerBoundDate, upperBoundDate);
    const expandingIterator = new ExpandingIterator<IConnection>();

    const iterator = expandingIterator.prepend(existingIterator);

    let lastStoreIndex = upperBoundIndex;

    const view: IExpandingForwardView = {
      lowerBoundDate,
      upperBoundDate,
      tryExpand: (connection: IConnection, storeIndex: number): boolean => {

        if (storeIndex - lastStoreIndex > 1) {
          // No idea if this can happen
          console.warn("Skipped", storeIndex - lastStoreIndex);
        }

        lastStoreIndex = storeIndex;

        if (connection.departureTime <= upperBoundDate) {
          expandingIterator.write(connection);

          return true; // Keep in expanding forward views

        } else {
          expandingIterator.close();
          iterator.close();

          return false; // Remove from expanding forward views
        }
      },
    };

    return { view, iterator };
  }

  private getIteratorView(backward: boolean, lowerBoundDate: Date, upperBoundDate: Date):
    { iterator: AsyncIterator<IConnection>, lowerBoundIndex: number, upperBoundIndex: number } {

    const lowerBoundIndex = this.getLowerBoundIndex(lowerBoundDate);
    const upperBoundIndex = this.getUpperBoundIndex(upperBoundDate);

    const indexIteratorOptions: IntegerIteratorOptions = {
      start: backward ? upperBoundIndex : lowerBoundIndex,
      end: backward ? lowerBoundIndex : upperBoundIndex,
      step: backward ? -1 : 1,
    };

    const iterator = new IntegerIterator(indexIteratorOptions)
      .map((index) => this.store[index]);

    return { iterator, lowerBoundIndex, upperBoundIndex };
  }

  private getLowerBoundIndex(date: Date): number {
    return this.binarySearch.findFirstIndex(date.valueOf(), 0, this.store.length - 1);
  }

  private getUpperBoundIndex(date: Date): number {
    return this.binarySearch.findLastIndex(date.valueOf(), 0, this.store.length - 1);
  }
}
