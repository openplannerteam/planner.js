import { AsyncIterator } from "asynciterator";

type Selector<T> = (values: Array<T | undefined | null>) => number;

export default class MergeIterator<T> extends AsyncIterator<T> {
  public values: T[];

  private readonly sourceIterators: Array<AsyncIterator<T>>;
  private readonly selector: (values: T[]) => number;

  constructor(sourceIterators: Array<AsyncIterator<T>>, selector: Selector<T>) {
    super();

    this.sourceIterators = sourceIterators;
    this.selector = selector;

    this.setMaxListeners(1000);

    this.values = Array(this.sourceIterators.length).fill(null);
    this.readable = true;

    for (const iterator of this.sourceIterators) {
      this.addListeners(iterator);
    }
  }

  public appendIterator(iterator: AsyncIterator<T>) {
    this.sourceIterators.push(iterator);
    this.values.push(null);
    this.addListeners(iterator);
  }

  public read(): T {
    for (let i = 0; i < this.sourceIterators.length; i++) {
      if (this.values[i] === null || this.values[i] === undefined) {
        const iterator = this.sourceIterators[i];

        if (!iterator.ended) {
          const value = iterator.read();

          if (value === null) {
            this.readable = false;
            return null;
          }

          this.values[i] = value;
        }
      }
    }

    const selectedIndex = this.selector(this.values);
    const item = this.values[selectedIndex];
    this.values[selectedIndex] = null;
    return item;
  }

  public close() {
    for (const iterator of this.sourceIterators) {
      iterator.close();
    }

    super.close();
  }

  private addListeners(iterator: AsyncIterator<T>) {
    iterator.on("end", () => {
      const allEnded = this.sourceIterators.every((iter) => iter.ended);

      if (allEnded) {
        this.close();
      } else if (!this.readable) {
        // everything that's still open is readable
        const allReadable = this.sourceIterators.every((iter) => iter.closed || iter.readable);

        if (allReadable) {
          this.readable = true;
        }
      }
    });

    iterator.on("readable", () => {
      if (!this.readable) {
        // everything that's still open is readable
        const allReadable = this.sourceIterators.every((iter) => iter.ended || iter.readable);

        if (allReadable) {
          this.readable = true;
        }
      }
    });
  }
}
