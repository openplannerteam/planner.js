import { AsyncIterator } from "asynciterator";
/**
 * AsyncIterator that merges a number of source asynciterators based on the passed selector function.
 *
 * The selector function gets passed an array of values read from each of the asynciterators.
 * Values can be undefined if their respective source iterator has ended.
 * The selector function should return the index in that array of the value to select.
 */
export default class MergeIterator<T> extends AsyncIterator<T> {
    private readonly sourceIterators;
    private readonly selector;
    private readonly condensed;
    private values;
    private waitingForFill;
    /**
     * @param sourceIterators
     * @param selector
     * @param condensed When true, undefined values are filtered from the array passed to the selector function
     */
    constructor(sourceIterators: Array<AsyncIterator<T>>, selector: (values: T[]) => number, condensed?: boolean);
    read(): T;
    close(): void;
    private fillValues;
    private fillValue;
    private waitForValue;
    private getCondensedValues;
    private addListeners;
}
