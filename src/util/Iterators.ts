import { AsyncIterator } from "asynciterator";

export default class Iterators {

  public static toArray<T>(iterator: AsyncIterator<T>): Promise<T[]> {

    const array = [];
    iterator.each((item: T) => array.push(item));

    return new Promise((resolve) => {
      iterator.on("end", () => resolve(array));
    });
  }

  public static getFirst<T>(iterator: AsyncIterator<T>): Promise<T> {
    return new Promise((resolve) => {
      iterator.on("readable", () => {
        resolve(iterator.read());
      });
    });
  }

  public static find<T>(iterator: AsyncIterator<T>, callback: (element: T) => boolean): Promise<T> {
    return new Promise((resolve, reject) => {
      iterator.on("readable", () => {
        let element = iterator.read();

        while (element && !callback(element)) {
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
