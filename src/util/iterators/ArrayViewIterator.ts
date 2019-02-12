import { AsyncIterator } from "asynciterator";

/**
 * An AsyncIterator that emits a range of items from a source array.
 *
 * Accepts a start and stop index and a step of +1 or -1
 */
export default class ArrayViewIterator<T> extends AsyncIterator<T> {

  private readonly source: T[];
  private readonly startIndex: number;
  private readonly stopIndex: number;
  private readonly step: number;

  private currentIndex: number;

  constructor(source: T[], startIndex: number, stopIndex: number, step: -1 | 1) {
    super();

    this.source = source;
    this.startIndex = startIndex;
    this.stopIndex = stopIndex;
    this.step = step;

    if (step > 0 ? stopIndex < startIndex : stopIndex > startIndex) {
      this.close();
      return;
    }

    this.currentIndex = startIndex;
    this.readable = true;
  }

  public read(): T {
    if (this.closed) {
      return null;
    }

    const {step, currentIndex, stopIndex} = this;

    if (step > 0 ? currentIndex > stopIndex : currentIndex < stopIndex) {
      this.close();
      return null;
    }

    const item = this.source[currentIndex];

    this.currentIndex += step;

    return item;
  }
}
