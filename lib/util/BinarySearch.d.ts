/**
 * Util class with binary search procedures
 * Assumes that array is in ascending order according to predicate
 */
export default class BinarySearch<T> {
    private readonly array;
    private readonly predicate;
    constructor(array: T[], predicate: (item: T) => number);
    /**
     * Find the first index of the given key, or the index before which that key would be hypothetically spliced in
     * Adapted from: https://algorithmsandme.com/first-occurrence-of-element/
     */
    findFirstIndex(key: number, start?: number, end?: number): number;
    /**
     * Find the last index of the given key, or the index after which that key would be hypothetically spliced in
     * Adapted from: https://www.algorithmsandme.com/last-occurrence-of-element-with-binary-search/
     */
    findLastIndex(key: number, start?: number, end?: number): number;
}
