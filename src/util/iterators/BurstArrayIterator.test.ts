import "jest";
import BurstArrayIterator from "./BurstArrayIterator";

describe("[BurstArrayIterator]", () => {

  it("basic", (done) => {

    const expected = [1, 1, 2, 3, 4, 5, 5, 5, 5, 6, 1, 5, 3, 5, 8];
    const filterUniqueIterator = new BurstArrayIterator<number>(expected, 20);

    let current = 0;

    filterUniqueIterator.each((str: number) => {
      expect(expected[current++]).toBe(str);
    });

    filterUniqueIterator.on("end", () => {
      expect(current).toBe(expected.length);
      done();
    });
  });

  it("smaller than burst", (done) => {

    const expected = [1, 1];
    const filterUniqueIterator = new BurstArrayIterator<number>(expected, 20);

    let current = 0;

    filterUniqueIterator.each((str: number) => {
      expect(expected[current++]).toBe(str);
    });

    filterUniqueIterator.on("end", () => {
      expect(current).toBe(expected.length);
      done();
    });
  });

});
