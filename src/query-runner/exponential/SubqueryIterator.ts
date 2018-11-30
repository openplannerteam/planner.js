import { AsyncIterator, BufferedIterator } from "asynciterator";

export default class SubqueryIterator<Q, R> extends BufferedIterator<R> {
  private queryIterator: AsyncIterator<Q>;
  private callback: (query: Q) => Promise<AsyncIterator<R>>;

  private currentResultIterator: AsyncIterator<R>;
  private currentResultPushed: number;
  private isLastResultIterator = false;

  constructor(queryIterator: AsyncIterator<Q>, run: (query: Q) => Promise<AsyncIterator<R>>) {
    super();

    this.queryIterator = queryIterator;
    this.callback = run;

    this.queryIterator.once("end", () => {
      this.isLastResultIterator = true;
    });
  }

  public _read(count: number, done: () => void) {
    if (!this.currentResultIterator) {
      const query = this.queryIterator.read();

      if (query) {
        this.runSubquery(query, done);

      } else {
        this.waitForSubquery(done);
      }

      return;
    }

    this.pushItemsAsync(done);
  }

  private runSubquery(subquery: Q, done: () => void) {
    const self = this;

    this.callback(subquery)
      .then((resultIterator: AsyncIterator<R>) => {
        self.currentResultIterator = resultIterator;
        self.currentResultPushed = 0;

        self.currentResultIterator.once("end", () => {
          delete self.currentResultIterator;

          // Close if last iterator
          if (self.isLastResultIterator) {
            self.close();
          }

          // Iterator was empty
          if (self.currentResultPushed === 0) {
            self._read(null, done);
          }
        });

        this.pushItemsAsync(done);
      });
  }

  private waitForSubquery(done: () => void) {
    this.queryIterator.once("readable", () => {
      const query = this.queryIterator.read();

      this.runSubquery(query, done);
    });
  }

  private pushItemsAsync(done) {
    this.currentResultIterator.on("readable", () => {
      this.pushItemsSync();
      done();
    });
  }

  private pushItemsSync(): boolean {
    let item = this.currentResultIterator.read();
    let hasPushed = false;

    while (item) {
      this._push(item);
      this.currentResultPushed++;
      hasPushed = true;

      item = this.currentResultIterator.read();
    }

    return hasPushed;
  }
}
