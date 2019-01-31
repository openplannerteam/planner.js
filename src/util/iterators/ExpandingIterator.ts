import { AsyncIterator } from "asynciterator";

export default class ExpandingIterator<T> extends AsyncIterator<T> {

  private buffer: T[];

  constructor() {
    super();

    this.buffer = [];
  }

  public read(): T {
    let item;

    if (this.buffer.length) {
      item = this.buffer.shift();

    } else {
      item = null;
      this.readable = false;
    }

    return item;
  }

  public write(item: T): void {
    this.buffer.push(item);
    this.readable = true;
  }
}
