import { AsyncIterator } from "asynciterator";

export default class ExpandingIterator<T> extends AsyncIterator<T> {

  private buffer: T[];
  private shouldClose: boolean;

  constructor() {
    super();

    this.buffer = [];
    this.shouldClose = false;
  }

  public read(): T {
    let item;

    if (this.buffer.length) {
      item = this.buffer.shift();

    } else {
      item = null;

      if (this.shouldClose) {
        this.close();

      }

      this.readable = false;
    }

    return item;
  }

  public write(item: T): void {
    if (!this.shouldClose) {
      this.buffer.push(item);
      this.readable = true;
    }
  }

  public closeAfterFlush(): void {
    this.shouldClose = true;
  }
}
