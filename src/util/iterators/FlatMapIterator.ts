import { AsyncIterator } from "asynciterator";

/**
 * This AsyncIterator maps every item of a query AsyncIterator to a result AsyncIterator by passing it through a
 * `run` function. All result AsyncIterator get concatenated to form the FlatMapIterator
 *
 * ```javascript
 *                  +-----+                     +-----+
 *   queryIterator  |0 & 9| +---+             + |1 & 8| +---+             + ...
 *                  +-----+     |               +-----+     |
 *                              v                           v
 *                  +-----------------------+   +-----------------------+
 * resultIterators  |01|02|04|05|06|07|08|09| + |11|12|13|14|15|16|17|18| + ...
 *                  +-----------------------+   +-----------------------+
 *
 *                  +-----------------------------------------------+
 * FlatMapIterator  |01|02|04|05|06|07|08|09|11|12|13|14|15|16|17|18| ...
 *                  +-----------------------------------------------+
 * ```
 */
export default class FlatMapIterator<Q, R> extends AsyncIterator<R> {
  private queryIterator: AsyncIterator<Q>;
  private callback: (query: Q) => AsyncIterator<R>;

  private currentResultIterator: AsyncIterator<R>;
  private isLastResultIterator = false;

  constructor(queryIterator: AsyncIterator<Q>, run: (query: Q) => AsyncIterator<R>) {
    super();

    this.queryIterator = queryIterator;
    this.callback = run;

    this.queryIterator.once("end", () => {
      this.isLastResultIterator = true;
    });

    this.readable = true;
  }

  public read(): R {
    if (this.closed) {
      return null;
    }

    if (!this.currentResultIterator) {
      const query: Q = this.queryIterator.read();

      if (query) {
        this.runQuery(query);

      } else {
        this.readable = false;
        this.queryIterator.once("readable", () => {
          this.readable = true;
        });
      }
    }

    if (this.currentResultIterator) {
      const item = this.currentResultIterator.read();

      if (!item) {
        this.readable = false;
      }

      return item;
    }

    return null;
  }

  private runQuery(query: Q) {
    this.currentResultIterator = this.callback(query);
    this.readable = this.currentResultIterator.readable;

    this.currentResultIterator.on("readable", () => {
      this.readable = true;
    });

    this.currentResultIterator.on("end", () => {
      if (this.isLastResultIterator) {
        this.close();
      }

      this.currentResultIterator = null;
      this.readable = true;
    });
  }
}
