import { ArrayIterator, AsyncIterator } from "asynciterator";
import "jest";
import IConnection from "../IConnection";
import IConnectionsIteratorOptions from "../IConnectionsIteratorOptions";
import ConnectionsStore from "./ConnectionsStore";

describe("[ConnectionsStore]", () => {

  /**
   * In this test, departureTime dates are substituted for numbers for simplicity
   * Inside the ConnectionsStore, #valueOf() gets called on the connection.departureTime
   * and both Dates and Numbers return a number
   */

  let connectionsStore;
  let createIterator;

  beforeEach(() => {
    const fakeDepartureTimes = [1, 2, 3, 3, 5, 6, 6, 6, 6, 7, 7];
    // @ts-ignore
    const fakeConnections: IConnection[] = fakeDepartureTimes
      .map((departureTime) => ({ departureTime }));

    const fakeSourceIterator = new ArrayIterator<IConnection>(fakeConnections);

    connectionsStore = new ConnectionsStore();

    connectionsStore.setSourceIterator(fakeSourceIterator);
    connectionsStore.startPrimaryPush(500);

    createIterator = (backward, lowerBoundDate, upperBoundDate): Promise<AsyncIterator<IConnection>> => {
      return new Promise((resolve) => {
        // Primary push start async, so get iterator async
        // Running a query is most often initiated by a user event, while prefetching start automatically
        setTimeout(() => {
          const iteratorOptions: IConnectionsIteratorOptions = {
            backward,
          };

          if (lowerBoundDate) {
            iteratorOptions.lowerBoundDate = (lowerBoundDate as unknown) as Date;
          }

          if (upperBoundDate) {
            iteratorOptions.upperBoundDate = (upperBoundDate as unknown) as Date;
          }

          resolve(connectionsStore.getIterator(iteratorOptions));
        }, 100);
      });
    };
  });

  describe("backward", () => {

    it("upperBoundDate is loaded & exists in store", async (done) => {
      const iteratorView = await createIterator(true, null, 6);

      const expected = [1, 2, 3, 3, 5, 6, 6, 6, 6];
      let current = expected.length - 1;

      iteratorView.each((str: IConnection) => {
        expect(expected[current--]).toBe(str.departureTime);
      });

      iteratorView.on("end", () => {
        expect(current).toBe(-1);
        done();
      });
    });

    it("upperBoundDate is loaded but doesn\'t exist in store", async (done) => {
      const iteratorView = await createIterator(true, null, 4);

      const expected = [1, 2, 3, 3];
      let current = expected.length - 1;

      iteratorView.each((str: IConnection) => {
        expect(expected[current--]).toBe(str.departureTime);
      });

      iteratorView.on("end", () => {
        expect(current).toBe(-1);
        done();
      });
    });

  });

  describe("forward", () => {

    it("lowerBoundDate is loaded & exists in store", async (done) => {
      const iteratorView = await createIterator(false, 3, 6);

      const expected = [3, 3, 5, 6, 6, 6, 6];
      let current = 0;

      iteratorView.each((str: IConnection) => {
        expect(expected[current++]).toBe(str.departureTime);
      });

      iteratorView.on("end", () => {
        expect(current).toBe(expected.length);
        done();
      });
    });

    it("lowerBoundDate is loaded but doesn\'t exist in store", async (done) => {
      const iteratorView = await createIterator(false, 4, 6);

      const expected = [5, 6, 6, 6, 6];
      let current = 0;

      iteratorView.each((str: IConnection) => {
        expect(expected[current++]).toBe(str.departureTime);
      });

      iteratorView.on("end", () => {
        expect(current).toBe(expected.length);
        done();
      });
    });

  });

});
