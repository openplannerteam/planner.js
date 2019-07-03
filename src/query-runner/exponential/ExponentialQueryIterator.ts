import { AsyncIterator } from "asynciterator";
import { DurationMs } from "../../interfaces/units";
import IResolvedQuery from "../IResolvedQuery";

/**
 * This AsyncIterator emits [[IResolvedQuery]] instances with exponentially increasing `maximumArrivalTime`.
 * For each emitted query, the time frame gets doubled (x2).
 */
export default class ExponentialQueryIterator extends AsyncIterator<IResolvedQuery> {
  private readonly baseQuery: IResolvedQuery;
  private timespan: DurationMs;

  constructor(baseQuery: IResolvedQuery, initialTimespan: DurationMs) {
    super();

    this.baseQuery = baseQuery;
    this.timespan = initialTimespan;

    this.readable = true;
  }

  public read(): IResolvedQuery {
    if (this.closed) {
      return null;
    }

    const {minimumDepartureTime} = this.baseQuery;
    const maximumArrivalTime = new Date(minimumDepartureTime.getTime() + this.timespan);

    this.timespan *= 2;

    if (this.timespan > 2 * 24 * 60 * 60 * 1000) {
      this.close();
    }

    return Object.assign({}, this.baseQuery, {maximumArrivalTime});
  }
}
