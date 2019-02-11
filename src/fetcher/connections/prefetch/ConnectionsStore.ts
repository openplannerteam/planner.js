import { AsyncIterator, EmptyIterator } from "asynciterator";
import { PromiseProxyIterator } from "asynciterator-promiseproxy";
import Context from "../../../Context";
import EventType from "../../../enums/EventType";
import BinarySearch from "../../../util/BinarySearch";
import ArrayViewIterator from "../../../util/iterators/ArrayViewIterator";
import ExpandingIterator from "../../../util/iterators/ExpandingIterator";
import Units from "../../../util/Units";
import IConnection from "../IConnection";
import IConnectionsIteratorOptions from "../IConnectionsIteratorOptions";
import IDeferredBackwardView from "./IDeferredBackwardView";
import IExpandingForwardView from "./IExpandingForwardView";

/**
 * Class used while prefetching [[IConnection]] instances. It allows appending connections
 * and creating iterator *views*. Iterator *views* are AsyncIterators that emit references to connections in the store.
 *
 * It is assumed that all connections are appended in ascending order by `departureTime`.
 *
 * Consequently this connections store serves as an in-memory cache for connections
 */
export default class ConnectionsStore {

  private static REPORTING_THRESHOLD = Units.fromMinutes(6);

  private readonly context: Context;
  private readonly store: IConnection[];
  private readonly binarySearch: BinarySearch<IConnection>;

  private sourceIterator: AsyncIterator<IConnection>;
  private deferredBackwardViews: IDeferredBackwardView[];
  private expandingForwardViews: IExpandingForwardView[];

  private hasFinishedPrimary: boolean;
  private isContinuing: boolean;
  private lastReportedDepartureTime: Date;

  constructor(context?: Context) {
    this.context = context;
    this.store = [];
    this.binarySearch = new BinarySearch<IConnection>(this.store, (connection) => connection.departureTime.valueOf());
    this.deferredBackwardViews = [];
    this.expandingForwardViews = [];
    this.hasFinishedPrimary = false;
    this.isContinuing = false;
  }

  public setSourceIterator(iterator: AsyncIterator<IConnection>): void {
    this.sourceIterator = iterator;
  }

  public startPrimaryPush(maxConnections: number): void {

    this.sourceIterator
      .transform({
        limit: maxConnections,
        destroySource: false,
      })
      .on("end", () => this.finishPrimaryPush())
      .each((connection: IConnection) => {
        if (this.context) {
          this.maybeEmitPrefetchEvent(connection);
        }

        this.append(connection);
      });
  }

  public getIterator(iteratorOptions: IConnectionsIteratorOptions): AsyncIterator<IConnection> {
    const { backward } = iteratorOptions;
    let { lowerBoundDate, upperBoundDate } = iteratorOptions;

    if (this.hasFinishedPrimary && this.store.length === 0) {
      return new EmptyIterator();
    }

    const firstConnection = this.store[0];
    const firstDepartureTime = firstConnection && firstConnection.departureTime;

    const lastConnection = this.store[this.store.length - 1];
    const lastDepartureTime = lastConnection && lastConnection.departureTime;

    if (lowerBoundDate && lowerBoundDate < firstDepartureTime) {
      throw new Error("Must supply a lowerBoundDate after the first prefetched connection");
    }

    if (backward) {

      if (!upperBoundDate) {
        throw new Error("Must supply upperBoundDate when iterating backward");
      }

      if (!lowerBoundDate) {
        lowerBoundDate = firstDepartureTime;
      }

      this.emitConnectionViewEvent(lowerBoundDate, upperBoundDate, false);

      // If the store is still empty or the latest departure time isn't later than the upperBoundDate,
      // then return a promise proxy iterator
      const notFinishedScenario = !this.hasFinishedPrimary
        && (!lastDepartureTime || lastDepartureTime <= upperBoundDate);

      const finishedScenario = this.hasFinishedPrimary
        && lastDepartureTime < upperBoundDate;

      if (notFinishedScenario || finishedScenario) {
        const { deferred, promise } = this.createDeferredBackwardView(lowerBoundDate, upperBoundDate);

        this.deferredBackwardViews.push(deferred);

        if (this.hasFinishedPrimary) {
          this.continueAfterFinishing();
        }

        return new PromiseProxyIterator(() => promise);
      }

    } else {

      if (!lowerBoundDate) {
        throw new Error("Must supply lowerBoundDate when iterating forward");
      }

      if (!upperBoundDate) {
        // Mock +infinity
        upperBoundDate = new Date(lowerBoundDate.valueOf() + Units.fromHours(24));
      }

      this.emitConnectionViewEvent(lowerBoundDate, upperBoundDate, false);

      // If the store is still empty or the latest departure time isn't later than the upperBoundDate,
      // then return a an expanding iterator view
      const notFinishedScenario = !this.hasFinishedPrimary
        && (!lastDepartureTime || lastDepartureTime <= upperBoundDate);

      const finishedScenario = this.hasFinishedPrimary
        && lastDepartureTime < upperBoundDate;

      if (notFinishedScenario || finishedScenario) {
        const { view, iterator } = this.createExpandingForwardView(lowerBoundDate, upperBoundDate);

        this.expandingForwardViews.push(view);

        if (this.hasFinishedPrimary) {
          this.continueAfterFinishing();
        }

        return iterator;
      }
    }

    // If the whole interval fits inside the prefetched window, return an iterator view
    if (lowerBoundDate >= firstDepartureTime && upperBoundDate < lastDepartureTime) {
      const { iterator } = this.getIteratorView(backward, lowerBoundDate, upperBoundDate);

      this.emitConnectionViewEvent(lowerBoundDate, upperBoundDate, true);

      return iterator;
    }

    throw new Error("This shouldn\'t happen");
  }

  /**
   * Add a new [[IConnection]] to the store.
   *
   * Additionally, this method checks if any forward iterator views can be expanded or if any backward iterator can be
   * resolved
   *
   * @returns the number of unsatisfied views
   */
  private append(connection: IConnection): number {
    this.store.push(connection);

    // Check if any deferred backward views are satisfied
    if (this.deferredBackwardViews.length) {
      this.deferredBackwardViews = this.deferredBackwardViews
        .filter(({ lowerBoundDate, upperBoundDate, resolve }) => {

          if (connection.departureTime > upperBoundDate) {
            const { iterator } = this.getIteratorView(true, lowerBoundDate, upperBoundDate);

            this.emitConnectionViewEvent(lowerBoundDate, upperBoundDate, true);

            resolve(iterator);
            return false;
          }

          return true;
        });
    }

    // Check if any forward views can be expanded
    if (this.expandingForwardViews.length) {
      this.expandingForwardViews = this.expandingForwardViews
        .filter(({ tryExpand }) => tryExpand(connection, this.store.length - 1));
    }

    return this.deferredBackwardViews.length + this.expandingForwardViews.length;
  }

  /**
   * Signals that the store will no longer be appended.
   * [[getIterator]] never returns a deferred backward view after this, because those would never get resolved
   */
  private finishPrimaryPush(): void {
    this.hasFinishedPrimary = true;

    if (this.deferredBackwardViews.length || this.expandingForwardViews.length) {
      this.continueAfterFinishing();
    }
  }

  private finishSecondaryPush(): void {
    this.isContinuing = false;
  }

  private continueAfterFinishing(): void {
    if (!this.isContinuing) {
      this.isContinuing = true;

      setTimeout(() => this.startSecondaryPush(), 0);
    }
  }

  private startSecondaryPush(): void {
    const secondaryPushIterator = this.sourceIterator
      .transform({destroySource: false})
      .on("end", () => this.finishSecondaryPush());

    secondaryPushIterator.each((connection: IConnection) => {
      if (this.context) {
        this.maybeEmitPrefetchEvent(connection);
      }

      const unsatisfiedViewCount = this.append(connection);

      if (unsatisfiedViewCount === 0) {
        secondaryPushIterator.close();
      }
    });
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

        // No need to keep trying to expand if the consumer has closed it
        if (iterator.closed) {
          expandingIterator.close();

          return false; // Remove from expanding forward views
        }

        if (connection.departureTime <= upperBoundDate) {
          expandingIterator.write(connection);

          return true; // Keep in expanding forward views

        } else {
          expandingIterator.closeAfterFlush();
          // iterator.close();

          this.emitConnectionViewEvent(lowerBoundDate, upperBoundDate, true);

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

    const start = backward ? upperBoundIndex : lowerBoundIndex;
    const stop = backward ? lowerBoundIndex : upperBoundIndex;
    const step = backward ? -1 : 1;

    const iterator = new ArrayViewIterator(this.store, start, stop, step);

    return { iterator, lowerBoundIndex, upperBoundIndex };
  }

  private getLowerBoundIndex(date: Date): number {
    return this.binarySearch.findFirstIndex(date.valueOf(), 0, this.store.length - 1);
  }

  private getUpperBoundIndex(date: Date): number {
    return this.binarySearch.findLastIndex(date.valueOf(), 0, this.store.length - 1);
  }

  private emitConnectionViewEvent(lowerBoundDate: Date, upperBoundDate: Date, completed: boolean) {
    if (this.context) {
      this.context.emit(EventType.ConnectionIteratorView, lowerBoundDate, upperBoundDate, completed);
    }
  }

  private maybeEmitPrefetchEvent(connection: IConnection): void {
    if (!this.lastReportedDepartureTime) {
      this.lastReportedDepartureTime = connection.departureTime;

      this.context.emit(EventType.ConnectionPrefetch, this.lastReportedDepartureTime);
      return;
    }

    const timeSinceLastEvent = connection.departureTime.valueOf() - this.lastReportedDepartureTime.valueOf();

    if (timeSinceLastEvent > ConnectionsStore.REPORTING_THRESHOLD) {
      this.lastReportedDepartureTime = connection.departureTime;

      this.context.emit(EventType.ConnectionPrefetch, this.lastReportedDepartureTime);
    }
  }
}
