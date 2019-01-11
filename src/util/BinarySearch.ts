export default class BinarySearch<T> {
  private readonly array: T[];
  private readonly predicate: (item: T) => number;

  constructor(array: T[], predicate: (item: T) => number) {
    this.array = array;
    this.predicate = predicate;
  }

  /**
   * Find the last index of the given key, or the index after which that key would be hypothetically spliced in
   * Adapted from: https://www.algorithmsandme.com/last-occurrence-of-element-with-binary-search/
   * @param key
   * @param start
   * @param end
   */
  public findLastIndex(key: number, start: number = 0, end: number = (this.array.length - 1)) {
    while (start < end) {
      const mid = start + Math.floor(((end - start) + 1) / 2);

      if (this.predicate(this.array[mid]) <= key) {
        start = mid;

      } else {
        end = mid - 1;
      }
    }

    return start;
  }
}
