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
  private endedSources: number;
  private shouldClose: boolean;

  /**
   * @param sourceIterators
   * @param selector
   * @param condensed When true, undefined values are filtered from the array passed to the selector function
   */
  constructor(sourceIterators: Array<AsyncIterator<T>>, selector: (values: T[]) => number, condensed?: boolean) {
    super();

    this.sourceIterators = sourceIterators;
    this.selector = selector;
    this.condensed = condensed;

    this.values = Array(this.sourceIterators.length).fill(undefined);
    this.waitingForFill = Array(this.sourceIterators.length).fill(false);
    this.endedSources = 0;

    this.addListeners();
    this.readable = true;
  }

  public read(): T {
    console.log("read", this.values.join(" "));

    const allFilled = this.fillValues();

    if (!allFilled) {
      console.log("!allFilled");
      this.readable = false;

      this.checkShouldClose();

      return null;
    }

    if (this.values.every((value) => value === undefined)) {
      console.log("Every");
      this.close();

      return null;
    }

    let selectedIndex: number;

    if (this.condensed) {
      const { values, indexMap } = this.getCondensedValues();

      selectedIndex = indexMap[this.selector(values)];

    } else {
      selectedIndex = this.selector(this.values);
    }

    if (selectedIndex < 0) {
      this.readable = false;
      console.log("< 0");
      this.checkShouldClose();

      return null;
    }

    const item = this.values[selectedIndex];
    this.values[selectedIndex] = undefined;

    this.readable = false;
    console.log("item");
    this.checkShouldClose();

    return item;
  }

  public close() {
    for (const iterator of this.sourceIterators) {
      iterator.close();
    }

    super.close();
  }

  private checkShouldClose() {
    console.log("Check readable", this.readable);

    if (this.shouldClose) {
      this.close();
    }
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

    let filledValues = 0;

    const r = Math.floor(Math.random() * 1000);
    console.log("filled creation", r, allWaiting);

    const filled = (actually = true) => {
      console.log("filled execution", r, filledValues, actually);
      filledValues++;

      if (filledValues === this.sourceIterators.length) {
        console.log("readable was", this.readable);
        this.readable = true;
      }
    };

    for (let sourceIndex = 0; sourceIndex < this.sourceIterators.length; sourceIndex++) {

      if (this.values[sourceIndex] !== undefined) {
        filled(false);

      } else {
        this.fillValue(sourceIndex, filled);
      }
    }

    return filledValues === this.sourceIterators.length;
  }

  private fillValue(sourceIndex: number, filled: (b?: boolean) => void) {
    const iterator = this.sourceIterators[sourceIndex];

    if (iterator.ended) {
      filled(false);
      return;
    }

    const value = iterator.read();

    if (value) {
      this.values[sourceIndex] = value;
      filled();

    } else {
      const shouldWait = !this.waitingForFill[sourceIndex];

      console.log("Should wait", sourceIndex, shouldWait);

      if (shouldWait) {
        this.waitingForFill[sourceIndex] = true;

        this.waitForValue(sourceIndex, filled);
      }
    }
  }

  private waitForValue(sourceIndex, filled: (b?: boolean) => void) {
    const iterator = this.sourceIterators[sourceIndex];

    if (iterator.ended) {
      filled(false);
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
        if (value !== undefined) {
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
        self.endedSources++;

        if (self.endedSources === self.sourceIterators.length) {
          self.shouldClose = true;
        }
      });
    }
  }
}
