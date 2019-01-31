import { ArrayIterator } from "asynciterator";
import "jest";
import AsyncArrayIterator from "./AsyncArrayIterator";
import FlatMapIterator from "./FlatMapIterator";

const ALPHABET = "abc";
const expected = ["a", "b", "b", "c", "c", "c"];

describe("[FlatMapIterator]", () => {

  const runTest = (QueryIterator, ResultIterator, done) => {
    const queryIterator = new QueryIterator([1, 2, 3], 10);

    const flatMapIterator = new FlatMapIterator<number, string>(queryIterator, (num) => {
      const array = Array(num).fill(ALPHABET[num - 1]);

      return new ResultIterator(array, 10);
    });

    let current = 0;

    flatMapIterator.each((str) => {
      expect(expected[current++]).toBe(str);
    });

    flatMapIterator.on("end", () => done());
  };

  it("Subqueries from ArrayIterator / Results from ArrayIterator", (done) => {
    runTest(ArrayIterator, ArrayIterator, done);
  });

  it("Subqueries from ArrayIterator / Results from BufferedIterator", (done) => {
    runTest(ArrayIterator, AsyncArrayIterator, done);
  });

  it("Subqueries from BufferedIterator / Results from BufferedIterator", (done) => {
    runTest(AsyncArrayIterator, AsyncArrayIterator, done);
  });
});
