import { AsyncIterator, BufferedIterator } from "asynciterator";

export default class FlatMapIterator<Q, R> extends BufferedIterator<R> {
  private queryIterator: AsyncIterator<Q>;
  private callback: (query: Q) => Promise<AsyncIterator<R>>;

  private currentResultIterator: AsyncIterator<R>;
  private currentResultPushed: number;
  private isLastResultIterator: boolean = false;
  private currentResultFinished: boolean = true;

  constructor(queryIterator: AsyncIterator<Q>, run: (query: Q) => Promise<AsyncIterator<R>>) {
    super({maxBufferSize: 1, autoStart: false});

    this.queryIterator = queryIterator;
    this.callback = run;

    this.queryIterator.once("end", () => {
      this.isLastResultIterator = true;
    });
  }

  // Not sure if this gets called
  public close() {
    this.currentResultIterator._end();

    super.close();
  }

  public _destroy() {
    this.currentResultIterator._end();
  }

  public _read(count: number, done: () => void) {
    if (this.currentResultFinished) {
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
        self.currentResultFinished = false;

        self.currentResultIterator.once("end", () => {
          self.currentResultFinished = true;

          // Close if last iterator
          if (self.isLastResultIterator) {
            self.close();
          }

          // Iterator was empty
          if (self.currentResultPushed === 0 && !this.closed) {
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
    this.currentResultIterator.once("readable", () => {
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
