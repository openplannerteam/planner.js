import { BufferedIterator } from "asynciterator";
import { DurationMs } from "../../interfaces/units";

/**
 * An AsyncIterator that emits the items of a given array in synchronous bursts of 3 items.
 * The bursts happen asynchronously.
 * Optionally accepts an interval (in ms) between each emitted item.
 *
 * This class is most useful in tests
 */
export default class BurstArrayIterator<T> extends BufferedIterator<T> {
  private currentIndex: number = 0;
  private readonly array: T[];
  private readonly interval: DurationMs;

  constructor(array: T[], interval: DurationMs = 0) {
    super();

    this.array = array;
    this.interval = interval;
  }

  public _read(count: number, done: () => void): void {
    if (this.currentIndex === this.array.length) {
      this.close();
      return done();
    }

    const self = this;

    const pushOne = () => {
      if (this.currentIndex < this.array.length) {
        self._push(self.array[self.currentIndex++]);
      }
    };

    setTimeout(() => {
      pushOne();
      pushOne();
      pushOne();
      done();
    }, this.interval);
  }
}
