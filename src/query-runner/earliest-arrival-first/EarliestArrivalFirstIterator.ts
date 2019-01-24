import { AsyncIterator } from "asynciterator";
import { DurationMs } from "../../interfaces/units";
import IResolvedQuery from "../IResolvedQuery";

// Inspired by IntegerIterator
export default class EarliestArrivalFirstIterator extends AsyncIterator<IResolvedQuery> {
  private readonly baseQuery: IResolvedQuery;
  private timespan: DurationMs;
  private readonly initialTimespan: DurationMs;

  constructor(baseQuery: IResolvedQuery, initialTimespan: DurationMs) {
    super();

    this.baseQuery = baseQuery;
    this.initialTimespan = initialTimespan;
    this.timespan = initialTimespan * 2;

    this.readable = true;
  }

  public read(): IResolvedQuery {
    if (this.closed) {
      return null;
    }

    const {minimumDepartureTime} = this.baseQuery;
    const maximumArrivalTime = new Date(minimumDepartureTime.getTime() + this.timespan);

    this.timespan += this.initialTimespan;

    return Object.assign({}, this.baseQuery, {maximumArrivalTime});
  }

}
