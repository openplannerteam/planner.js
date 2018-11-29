import { AsyncIterator } from "asynciterator";

export default class Iterators {

  public static toArray<T>(iterator: AsyncIterator<T>): Promise<T[]> {

    const array = [];
    iterator.each((item: T) => array.push(item));

    return new Promise((resolve) => {
      iterator.on("end", () => resolve(array));
    });
  }
}
