import { ArrayIterator } from "asynciterator";
import "jest";
import SubqueryIterator from "./SubqueryIterator";

const ALPHABET = "abc";

const queryIterator = new ArrayIterator<number>([1, 2, 3]);

const subqueryIterator = new SubqueryIterator<number, string>(queryIterator, (num) => {
  return new Promise((resolve) => {
    const array = Array(num).fill(ALPHABET[num - 1]);

    resolve(new ArrayIterator<string>(array));
  });
});

test("[SubqueryIterator]", (done) => {

  let current = 0;
  const expected = ["a", "b", "b", "c", "c", "c"];

  subqueryIterator.each((str) => {
    expect(expected[current++]).toBe(str);
  });

  subqueryIterator.on("end", () => done());

});
