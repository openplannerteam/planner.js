import "jest";
import runDemo from "./demo";

test("demo", async () => {
  jest.setTimeout(90000);

  const result = await runDemo();

  expect(result).toEqual(true);
});
