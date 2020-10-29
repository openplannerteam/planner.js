import { AsyncIterator } from "asynciterator";
/**
 * Utility class with functions to operate on AsyncIterator instances
 */
export default class Iterators {
    /**
     * Returns an array representation of an AsyncIterator.
     * Assumes the iterator will end sometime
     */
    static toArray<T>(iterator: AsyncIterator<T>): Promise<T[]>;
    /**
     * Returns the first element of an AsyncIterator.
     */
    static getFirst<T>(iterator: AsyncIterator<T>): Promise<T>;
    /**
     * Iterates over elements of an AsyncIterator, returning the first element ´predicate´ returns truthy for.
     */
    static find<T>(iterator: AsyncIterator<T>, predicate: (element: T) => boolean): Promise<T>;
}
