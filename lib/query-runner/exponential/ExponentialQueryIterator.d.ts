import { AsyncIterator } from "asynciterator";
import { DurationMs } from "../../interfaces/units";
import IResolvedQuery from "../IResolvedQuery";
/**
 * This AsyncIterator emits [[IResolvedQuery]] instances with exponentially increasing `maximumArrivalTime`.
 * For each emitted query, the time frame gets doubled (x2).
 */
export default class ExponentialQueryIterator extends AsyncIterator<IResolvedQuery> {
    private readonly baseQuery;
    private timespan;
    constructor(baseQuery: IResolvedQuery, initialTimespan: DurationMs);
    read(): IResolvedQuery;
}
