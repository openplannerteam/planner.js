import { BufferedIterator } from "asynciterator";
import { DurationMs } from "../../interfaces/units";
/**
 * An AsyncIterator that emits the items of a given array in synchronous bursts of 3 items.
 * The bursts happen asynchronously.
 * Optionally accepts an interval (in ms) between each emitted item.
 *
 * This class is most useful in tests
 */
export default class BurstArrayIterator<T> extends BufferedIterator<T> {
    private currentIndex;
    private readonly array;
    private readonly interval;
    constructor(array: T[], interval?: DurationMs);
    _read(count: number, done: () => void): void;
}
