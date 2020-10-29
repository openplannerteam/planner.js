import { AsyncIterator } from "asynciterator";
/**
 * An AsyncIterator that emits a range of items from a source array.
 *
 * Accepts a start and stop index and a step of +1 or -1
 */
export default class ArrayViewIterator<T> extends AsyncIterator<T> {
    private readonly source;
    private readonly startIndex;
    private readonly stopIndex;
    private readonly step;
    private currentIndex;
    constructor(source: T[], startIndex: number, stopIndex: number, step: -1 | 1);
    read(): T;
}
