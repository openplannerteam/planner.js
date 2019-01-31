import "jest";
import ArrayViewIterator from "./ArrayViewIterator";

describe("[ArrayViewIterator]", () => {

  const sourceArray = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  it("step +1 and start < stop", (done) => {

    const viewIterator = new ArrayViewIterator<number>(
      sourceArray, 1, 5, +1,
    );

    const expected = [2, 3, 4, 5, 6];
    let currentRead = 0;

    viewIterator.each((str: number) => {
      expect(expected[currentRead++]).toBe(str);
    });

    viewIterator.on("end", () => {
      expect(currentRead).toBe(expected.length);

      done();
    });
  });

  it("step +1 and start > stop", (done) => {

    const viewIterator = new ArrayViewIterator<number>(
      sourceArray, 5, 1, +1,
    );

    const each = jest.fn();
    viewIterator.each(each);

    viewIterator.on("end", () => {
      expect(each).not.toHaveBeenCalled();

      done();
    });
  });

  it("step -1 and start > stop", (done) => {

    const viewIterator = new ArrayViewIterator<number>(
      sourceArray, 5, 1, -1,
    );

    const expected = [2, 3, 4, 5, 6];
    let currentRead = expected.length - 1;

    viewIterator.each((str: number) => {
      expect(expected[currentRead--]).toBe(str);
    });

    viewIterator.on("end", () => {
      expect(currentRead).toBe(-1);

      done();
    });
  });

  it("step -1 and start < stop", (done) => {

    const viewIterator = new ArrayViewIterator<number>(
      sourceArray, 1, 5, -1,
    );

    const each = jest.fn();
    viewIterator.each(each);

    viewIterator.on("end", () => {
      expect(each).not.toHaveBeenCalled();

      done();
    });
  });

});
