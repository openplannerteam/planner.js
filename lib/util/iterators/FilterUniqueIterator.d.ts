import { AsyncIterator, SimpleTransformIterator } from "asynciterator";
/**
 * An AsyncIterator that emits only the unique items emitted by a source iterator.
 *
 * Uniqueness is determined by a comparator callback function
 *
 * Note: All (unique) items get stored in an array internally
 */
export default class FilterUniqueIterator<T> extends SimpleTransformIterator<T, T> {
    private readonly comparator;
    private store;
    constructor(source: AsyncIterator<T>, comparator: (object: T, otherObject: T) => boolean);
    _filter(object: T): boolean;
}
