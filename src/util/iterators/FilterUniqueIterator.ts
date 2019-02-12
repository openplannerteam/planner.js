import { AsyncIterator, SimpleTransformIterator } from "asynciterator";

/**
 * An AsyncIterator that emits only the unique items emitted by a source iterator.
 *
 * Uniqueness is determined by a comparator callback function
 *
 * Note: All (unique) items get stored in an array internally
 */
export default class FilterUniqueIterator<T> extends SimpleTransformIterator<T, T> {

  private readonly comparator: (object: T, otherObject: T) => boolean;
  private store: T[];

  constructor(source: AsyncIterator<T>, comparator: (object: T, otherObject: T) => boolean) {
    super(source, {
      maxBufferSize: 1,
      autoStart: false,
    });

    this.comparator = comparator;
    this.store = [];
  }

  public _filter(object: T): boolean {

    const isUnique = !this.store
      .some((storedObject: T) => this.comparator(object, storedObject));

    if (isUnique) {
      this.store.push(object);
    }

    return isUnique;
  }
}
