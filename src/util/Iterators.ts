import { AsyncIterator } from "asynciterator";

/**
 * Utility class with functions to operate on AsyncIterator instances
 */
export default class Iterators {

  /**
   * Returns an array representation of an AsyncIterator.
   * Assumes the iterator will end sometime
   */
  public static toArray<T>(iterator: AsyncIterator<T>): Promise<T[]> {
    const array = [];
    iterator.each((item: T) => array.push(item));

    return new Promise((resolve) => {
      iterator.on("end", () => resolve(array));
    });
  }

  /**
   * Returns the first element of an AsyncIterator.
   */
  public static getFirst<T>(iterator: AsyncIterator<T>): Promise<T> {
    return new Promise((resolve) => {
      iterator.on("readable", () => {
        resolve(iterator.read());
      });
    });
  }

  /**
   * Iterates over elements of an AsyncIterator, returning the first element ´predicate´ returns truthy for.
   */
  public static find<T>(iterator: AsyncIterator<T>, predicate: (element: T) => boolean): Promise<T> {
    return new Promise((resolve, reject) => {
      iterator.on("readable", () => {
        let element = iterator.read();

        while (element && !predicate(element)) {
          element = iterator.read();
        }

        if (element) {
          resolve(element);
        }
      });

      iterator.on("end", () => resolve(null));
    });
  }
}
