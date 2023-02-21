import { ArrayIterator } from "asynciterator";
import "jest";
import AsyncArrayIterator from "./AsyncArrayIterator";
import BurstArrayIterator from "./BurstArrayIterator";
import MergeIterator from "./MergeIterator";

const createSources = (IteratorClass) => {
  const firstIterator = new IteratorClass([1, 8, 10, 13], 10);
  const secondIterator = new IteratorClass([4, 11], 10);
  const thirdIterator = new IteratorClass([3, 5, 6, 12, 18], 10);

  return [firstIterator, secondIterator, thirdIterator];
};

const expected = [1, 3, 4, 5, 6, 8, 10, 11, 12, 13, 18];

const uncondensedSelector = (numbers: number[]) => {
  let smallestIndex = -1;

  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] === null || numbers[i] === undefined) {
      continue;
    }

    if (smallestIndex < 0) {
      smallestIndex = i;
      continue;
    }

    if (numbers[i] < numbers[smallestIndex]) {
      smallestIndex = i;
    }
  }

  return Math.max(smallestIndex, 0);
};

describe("[MergeIterator]", () => {
  describe("sync sources", () => {

    it("uncondensed", (done) => {
      const mergeIterator = new MergeIterator<number>(createSources(ArrayIterator), uncondensedSelector);
      let current = 0;

      mergeIterator.each((str) => {
        console.log(str);
        expect(expected[current++]).toBe(str);
      });

      mergeIterator.on("end", () => done());
    });
  });

  describe("async sources", () => {
    it("uncondensed", (done) => {
      const mergeIterator = new MergeIterator<number>(createSources(AsyncArrayIterator), uncondensedSelector);
      let current = 0;

      mergeIterator.each((str) => {
        expect(expected[current++]).toBe(str);
      });

      mergeIterator.on("end", () => done());
    });
  });

  describe("mixed sources", () => {
    it("uncondensed", (done) => {
      const mergeIterator = new MergeIterator<number>(createSources(BurstArrayIterator), uncondensedSelector);
      let current = 0;

      mergeIterator.each((str) => {
        expect(expected[current++]).toBe(str);
      });

      mergeIterator.on("end", () => done());
    });
  });
});
