import { ArrayIterator } from "asynciterator";
import "jest";
import AsyncArrayIterator from "../../util/iterators/AsyncArrayIterator";
import SubqueryIterator from "./SubqueryIterator";

const ALPHABET = "abc";
const expected = ["a", "b", "b", "c", "c", "c"];

describe("[SubqueryIterator]", () => {

  const runTest = (QueryIterator, ResultIterator, done) => {
    const queryIterator = new QueryIterator([1, 2, 3], 10);

    const subqueryIterator = new SubqueryIterator<number, string>(queryIterator, (num) => {
      return new Promise((resolve) => {
        const array = Array(num).fill(ALPHABET[num - 1]);

        resolve(new ResultIterator(array, 10));
      });
    });

    let current = 0;

    subqueryIterator.each((str) => {
      expect(expected[current++]).toBe(str);
    });

    subqueryIterator.on("end", () => done());
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
