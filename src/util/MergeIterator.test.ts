import { ArrayIterator } from "asynciterator";
import "jest";
import MergeIterator from "./MergeIterator";

const createSources = () => {
  const firstIterator = new ArrayIterator<number>([1, 8, 10, 13]);
  const secondIterator = new ArrayIterator<number>([4, 11]);
  const thirdIterator = new ArrayIterator<number>([3, 5, 6, 12, 18]);

  return [firstIterator, secondIterator, thirdIterator];
};

describe("[MergeIterator]", () => {

  it("uncondensed", (done) => {

    const mergeIterator = new MergeIterator<number>(createSources(), (numbers: number[]) => {

      let smallestIndex = -1;

      for (let i = 0; i < numbers.length; i++) {
        if (smallestIndex < 0 && numbers[i] !== undefined) {
          smallestIndex = i;
          continue;
        }

        if (numbers[i] !== undefined && numbers[i] < numbers[smallestIndex]) {
          smallestIndex = i;
        }
      }

      return smallestIndex;
    });

    let current = 0;
    const expected = [1, 3, 4, 5, 6, 8, 10, 11, 12, 13, 18];

    mergeIterator.each((str) => {
      expect(expected[current++]).toBe(str);
    });

    mergeIterator.on("end", () => done());
  });

  it("condensed", (done) => {

    const mergeIterator = new MergeIterator<number>(createSources(), (numbers: number[]) => {

      let smallestIndex = 0;

      for (let i = 1; i < numbers.length; i++) {
        if (numbers[i] !== undefined && numbers[i] < numbers[smallestIndex]) {
          smallestIndex = i;
        }
      }

      return smallestIndex;
    }, true);

    let current = 0;
    const expected = [1, 3, 4, 5, 6, 8, 10, 11, 12, 13, 18];

    mergeIterator.each((str) => {
      expect(expected[current++]).toBe(str);
    });

    mergeIterator.on("end", () => done());
  });

});
