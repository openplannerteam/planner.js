import "jest";
import BinarySearch from "./BinarySearch";

describe("[BinarySearch]", () => {

  const array = [1, 2, 3, 3, 5, 6, 6, 6, 6, 7, 7];
  const search = new BinarySearch<number>(array, (a) => a);

  describe("findFirstIndex", () => {

    it("key exists", () => {
      const resultIndex = search.findFirstIndex(6);
      const expectedIndex = 5;

      expect(resultIndex).toBe(expectedIndex);
    });

    it("key doesn\'t exist / belongs at the start", () => {
      const resultIndex = search.findFirstIndex(0);
      const expectedIndex = 0;

      expect(resultIndex).toBe(expectedIndex);
    });

    it("key doesn\'t exist / belongs in middle", () => {
      const resultIndex = search.findFirstIndex(4);
      const expectedIndex = 4;

      expect(resultIndex).toBe(expectedIndex);
    });

    it("key doesn\'t exist / belongs at the end", () => {
      const resultIndex = search.findFirstIndex(8);
      const expectedIndex = 10;

      expect(resultIndex).toBe(expectedIndex);
    });

  });

  describe("findLastIndex", () => {

    it("key exists", () => {
      const resultIndex = search.findLastIndex(6);
      const expectedIndex = 8;

      expect(resultIndex).toBe(expectedIndex);
    });

    it("key doesn\'t exist / belongs at the start", () => {
      const resultIndex = search.findLastIndex(0);
      const expectedIndex = 0;

      expect(resultIndex).toBe(expectedIndex);
    });

    it("key doesn\'t exist / belongs in middle", () => {
      const resultIndex = search.findLastIndex(4);
      const expectedIndex = 3;

      expect(resultIndex).toBe(expectedIndex);
    });

    it("key doesn\'t exist / belongs at the end", () => {
      const resultIndex = search.findLastIndex(8);
      const expectedIndex = 10;

      expect(resultIndex).toBe(expectedIndex);
    });

  });

});
