import { AsyncIterator } from "asynciterator";
import { DurationMs } from "../../interfaces/units";
import IResolvedQuery from "../IResolvedQuery";

// Inspired by IntegerIterator
export default class LinearQueryIterator extends AsyncIterator<IResolvedQuery> {
  private readonly baseQuery: IResolvedQuery;
  private timespan: DurationMs;
  private index: number;
  private readonly a: DurationMs;
  private readonly b: DurationMs;

  constructor(baseQuery: IResolvedQuery, a: DurationMs, b: DurationMs) {
    super();

    this.baseQuery = baseQuery;
    this.index = 1;
    this.a = a;
    this.b = b;

    this.timespan = a * this.index + b;

    this.readable = true;
  }

  public read(): IResolvedQuery {
    if (this.closed) {
      return null;
    }

    const {minimumDepartureTime} = this.baseQuery;
    const maximumArrivalTime = new Date(minimumDepartureTime.getTime() + this.timespan);

    this.index++;
    this.timespan = this.a * this.index + this.b;

    console.log(Object.assign({}, this.baseQuery, {maximumArrivalTime}));
    return Object.assign({}, this.baseQuery, {maximumArrivalTime});
  }

}
