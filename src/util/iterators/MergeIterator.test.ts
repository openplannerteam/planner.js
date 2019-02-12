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
    if (smallestIndex < 0 && numbers[i] !== undefined) {
      smallestIndex = i;
      continue;
    }

    if (numbers[i] !== undefined && numbers[i] < numbers[smallestIndex]) {
      smallestIndex = i;
    }
  }

  return smallestIndex;
};

const condensedSelector = (numbers: number[]) => {

  let smallestIndex = 0;

  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] !== undefined && numbers[i] < numbers[smallestIndex]) {
      smallestIndex = i;
    }
  }

  return smallestIndex;
};

describe("[MergeIterator]", () => {

  describe("sync sources", () => {

    it("uncondensed", (done) => {
      const mergeIterator = new MergeIterator<number>(createSources(ArrayIterator), uncondensedSelector, false);
      let current = 0;

      mergeIterator.each((str) => {
        expect(expected[current++]).toBe(str);
      });

      mergeIterator.on("end", () => done());
    });

    it("condensed", (done) => {
      const mergeIterator = new MergeIterator<number>(createSources(ArrayIterator), condensedSelector, true);
      let current = 0;

      mergeIterator.each((str) => {
        expect(expected[current++]).toBe(str);
      });

      mergeIterator.on("end", () => done());
    });

  });

  describe("async sources", () => {

    it("uncondensed", (done) => {
      const mergeIterator = new MergeIterator<number>(createSources(AsyncArrayIterator), uncondensedSelector, false);
      let current = 0;

      mergeIterator.each((str) => {
        expect(expected[current++]).toBe(str);
      });

      mergeIterator.on("end", () => done());
    });

    it("condensed", (done) => {
      const mergeIterator = new MergeIterator<number>(createSources(AsyncArrayIterator), condensedSelector, true);
      let current = 0;

      mergeIterator.each((str) => {
        expect(expected[current++]).toBe(str);
      });

      mergeIterator.on("end", () => done());
    });

  });

  describe("mixed sources", () => {

    it("uncondensed", (done) => {
      const mergeIterator = new MergeIterator<number>(createSources(BurstArrayIterator), uncondensedSelector, false);
      let current = 0;

      mergeIterator.each((str) => {
        expect(expected[current++]).toBe(str);
      });

      mergeIterator.on("end", () => done());
    });

    it("condensed", (done) => {
      const mergeIterator = new MergeIterator<number>(createSources(BurstArrayIterator), condensedSelector, true);
      let current = 0;

      mergeIterator.each((str) => {
        expect(expected[current++]).toBe(str);
      });

      mergeIterator.on("end", () => done());
    });

  });
});
