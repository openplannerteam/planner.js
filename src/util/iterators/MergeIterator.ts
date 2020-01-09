import { AsyncIterator } from "asynciterator";

/**
 * AsyncIterator that merges a number of source asynciterators based on the passed selector function.
 *
 * The selector function gets passed an array of values read from each of the asynciterators.
 * Values can be undefined if their respective source iterator has ended.
 * The selector function should return the index in that array of the value to select.
 */
export default class MergeIterator<T> extends AsyncIterator<T> {
  private readonly sourceIterators: Array<AsyncIterator<T>>;
  private readonly selector: (values: T[]) => number;
  private readonly condensed: boolean;

  private values: T[];
  private waitingForFill: boolean[];

  /**
   * @param sourceIterators
   * @param selector
   * @param condensed When true, undefined values are filtered from the array passed to the selector function
   */
  constructor(sourceIterators: Array<AsyncIterator<T>>, selector: (values: T[]) => number, condensed = false) {
    super();

    this.sourceIterators = sourceIterators;
    this.selector = selector;

    this.setMaxListeners(1000);

    this.values = Array(this.sourceIterators.length).fill(undefined);
    this.waitingForFill = Array(this.sourceIterators.length).fill(false);
    this.readable = true;
    this.condensed = condensed;
    this.addListeners();
  }

  public read(): T {
    const allFilled = this.fillValues();

    if (!allFilled) {
      this.readable = false;

      return null;
    }

    let selectedIndex: number;

    if (this.condensed) {
      const { values, indexMap } = this.getCondensedValues();

      selectedIndex = indexMap[this.selector(values)];

    } else {
      selectedIndex = this.selector(this.values);
    }

    const item = this.values[selectedIndex];
    this.values[selectedIndex] = undefined;

    this.readable = false;

    return item;
  }

  public close() {
    for (const iterator of this.sourceIterators) {
      iterator.close();
    }

    super.close();
  }

  private fillValues(): boolean {

    const allWaiting = this.waitingForFill.every((waiting) => waiting);

    if (allWaiting) {
      return false;
    }

    const allFilled = this.values.every((value) => value !== undefined);

    if (allFilled) {
      return true;
    }

    const allEnded = this.sourceIterators.every((iterator) => iterator.ended);

    if (allEnded) {
      return false;
    }

    let filledValues = 0;

    const filled = () => {
      filledValues++;

      if (filledValues === this.sourceIterators.length) {
        this.readable = true;
      }
    };

    for (let sourceIndex = 0; sourceIndex < this.sourceIterators.length; sourceIndex++) {

      if (this.sourceIterators[sourceIndex].ended) {
        filled();
        continue;
      }

      if (this.values[sourceIndex] !== undefined && this.values[sourceIndex] !== null) {
        filled();

      } else {
        this.fillValue(sourceIndex, filled);
      }
    }

    return filledValues === this.sourceIterators.length;
  }

  private fillValue(sourceIndex: number, filled: () => void) {
    const iterator = this.sourceIterators[sourceIndex];
    const value = iterator.read();

    if (value || (!iterator.closed && iterator.readable)) {
      this.values[sourceIndex] = value;
      filled();
    } else {
      const shouldWait = !this.waitingForFill[sourceIndex];

      if (shouldWait) {
        this.waitingForFill[sourceIndex] = true;

        this.waitForValue(sourceIndex, filled);
      }
    }
  }

  private waitForValue(sourceIndex, filled: () => void) {
    const iterator = this.sourceIterators[sourceIndex];

    if (iterator.ended) {
      filled();
      return;
    }

    iterator.once("readable", () => {
      const value = iterator.read();

      if (value === null) {
        this.waitForValue(sourceIndex, filled);

      } else {
        this.values[sourceIndex] = value;
        this.waitingForFill[sourceIndex] = false;
        filled();
      }
    });
  }

  private getCondensedValues() {
    const values = [];
    const indexMap = [];

    this.values
      .forEach((value: T, originalIndex: number) => {
        if (value !== undefined && value !== null) {
          values.push(value);
          indexMap.push(originalIndex);
        }
      }, {});

    return { values, indexMap };
  }

  private addListeners() {
    const self = this;

    for (const iterator of this.sourceIterators) {
      iterator.on("end", () => {
        const allEnded = this.sourceIterators.every((iter) => iter.ended);

        if (allEnded) {
          this.close();
        }
      });
    }
  }
}
