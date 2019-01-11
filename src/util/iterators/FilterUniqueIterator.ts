import { AsyncIterator, SimpleTransformIterator } from "asynciterator";

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
