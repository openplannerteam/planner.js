import { ArrayIterator } from "asynciterator";
import "jest";
import FilterUniqueIterator from "./FilterUniqueIterator";

describe("[FilterUniqueIterator]", () => {

  it("basic", (done) => {

    const numberIterator = new ArrayIterator<number>([1, 1, 2, 3, 4, 5, 5, 5, 5, 6, 1, 5, 3, 5, 8]);
    const filterUniqueIterator = new FilterUniqueIterator<number>(
      numberIterator,
      (a, b) => a === b,
    );

    let current = 0;
    const expected = [1, 2, 3, 4, 5, 6, 8];

    filterUniqueIterator.each((str: number) => {
      expect(expected[current++]).toBe(str);
    });

    filterUniqueIterator.on("end", () => done());
  });

});
