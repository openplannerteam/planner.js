import { AsyncIterator, BufferedIterator } from "asynciterator";

export default class SubqueryIterator<Q, R> extends BufferedIterator<R> {
  private queryIterator: AsyncIterator<Q>;
  private callback: (query: Q) => Promise<AsyncIterator<R>>;

  private currentResultIterator: AsyncIterator<R>;
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

        self.currentResultIterator.once("end", () => {
          if (self.isLastResultIterator) {
            self.close();
          }

          delete self.currentResultIterator;
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
      hasPushed = true;

      item = this.currentResultIterator.read();
    }

    return hasPushed;
  }
}
