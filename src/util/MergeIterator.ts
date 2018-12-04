import { AsyncIterator, BufferedIterator } from "asynciterator";

type MergeIteratorSelector<T> = (values: T[]) => number;

export default class MergeIterator<T> extends BufferedIterator<T> {
  private readonly sourceIterators: Array<AsyncIterator<T>>;
  private readonly selector: MergeIteratorSelector<T>;
  private readonly condensed: boolean;

  private values: T[];
  private lastPushedIndex: number;
  private endedSources: number;
  private shouldClose: boolean;

  constructor(sourceIterators: Array<AsyncIterator<T>>, selector: MergeIteratorSelector<T>, condensed?: boolean) {
    super();

    this.sourceIterators = sourceIterators;
    this.selector = selector;
    this.condensed = condensed;

    this.endedSources = 0;

    this.addListeners();
  }

  public _read(count: number, done: () => void): void {
    if (!this.values) {
      this.fillFirstValues(done);
      return;
    }

    this.fillValue(this.lastPushedIndex, () => {
      this.doPush(done);
    });
  }

  private fillFirstValues(done) {
    this.values = Array(this.sourceIterators.length).fill(undefined);
    let filledValues = 0;

    const filled = () => {
      filledValues++;

      if (filledValues === this.sourceIterators.length) {
        this.doPush(done);
      }
    };

    for (let i = 0; i < this.sourceIterators.length; i++) {
      this.fillValue(i, filled);
    }
  }

  private fillValue(sourceIndex: number, filled: () => void) {
    const iterator = this.sourceIterators[sourceIndex];

    if (iterator.ended) {
      filled();
      return;
    }

    const value = iterator.read();

    if (value) {
      this.values[sourceIndex] = value;
      filled();

    } else {
      iterator.once("readable", () => {
        this.values[sourceIndex] = iterator.read();
        filled();
      });
    }
  }

  private doPush(done: () => void) {
    if (this.condensed) {
      const { values, indexMap } = this.getCondensedValues();

      this.lastPushedIndex = indexMap[this.selector(values)];

    } else {
      this.lastPushedIndex = this.selector(this.values);
    }

    this._push(this.values[this.lastPushedIndex]);
    this.values[this.lastPushedIndex] = undefined;

    done();

    if (this.shouldClose) {
      this.close();
    }
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
