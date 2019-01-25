import { AsyncIterator } from "asynciterator";
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

  describe("Loaded sync", () => {

    let connectionsStore;
    let createIterator;

    beforeEach(() => {
      const fakeDepartureTimes = [1, 2, 3, 3, 5, 6, 6, 6, 6, 7, 7];
      // @ts-ignore
      const fakeConnections: IConnection[] = fakeDepartureTimes
        .map((departureTime) => ({ departureTime }));

      connectionsStore = new ConnectionsStore();
      for (const connection of fakeConnections) {
        connectionsStore.append(connection);
      }

      connectionsStore.finish();

      createIterator = (backward, lowerBoundDate, upperBoundDate): Promise<AsyncIterator<IConnection>> => {
        const iteratorOptions: IConnectionsIteratorOptions = {
          backward,
        };

        if (lowerBoundDate) {
          iteratorOptions.lowerBoundDate = (lowerBoundDate as unknown) as Date;
        }

        if (upperBoundDate) {
          iteratorOptions.upperBoundDate = (upperBoundDate as unknown) as Date;
        }

        return connectionsStore.getIterator(iteratorOptions);
      };

    });

    describe("backward", () => {

      it("upperBoundDate is loaded & exists in store", async (done) => {
        const iteratorView = createIterator(true, null, 6);

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
        const iteratorView = createIterator(true, null, 4);

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
        const iteratorView = createIterator(false, 3, null);

        const expected = [3, 3, 5, 6, 6, 6, 6, 7, 7];
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
        const iteratorView = createIterator(false, 4, null);

        const expected = [5, 6, 6, 6, 6, 7, 7];
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

  describe("Loaded async", () => {
    jest.setTimeout(1000000);

    let connectionsStore;

    beforeEach(() => {

      const fakeDepartureTimes = [1, 2, 3, 3, 5, 6, 6, 6, 6, 7, 7, 8];
      // @ts-ignore
      const fakeConnections: IConnection[] = fakeDepartureTimes
        .map((departureTime) => ({ departureTime }));

      connectionsStore = new ConnectionsStore();

      // Append first few connections sync
      for (const connection of fakeConnections.slice(0, 6)) {
        connectionsStore.append(connection);
      }

      // Append remaining connections async
      let i = 6;
      const appendNext = () => {
        connectionsStore.append(fakeConnections[i++]);

        if (i < fakeConnections.length) {
          setTimeout(appendNext, 100);

        } else {
          connectionsStore.finish();
        }
      };

      setTimeout(appendNext, 100);
    });

    it("backward", async (done) => {
      const iteratorOptions: IConnectionsIteratorOptions = {
        backward: true,
        upperBoundDate: (7 as unknown) as Date,
      };
      const iteratorView: AsyncIterator<IConnection> = connectionsStore.getIterator(iteratorOptions);

      const expected = [1, 2, 3, 3, 5, 6, 6, 6, 6, 7, 7];
      let current = expected.length - 1;

      iteratorView.each((str: IConnection) => {
        expect(expected[current--]).toBe(str.departureTime);
      });

      iteratorView.on("end", () => {
        expect(current).toBe(-1);
        done();
      });
    });

    it("forward", async (done) => {
      const iteratorOptions: IConnectionsIteratorOptions = {
        backward: false,
        lowerBoundDate: (2 as unknown) as Date,
        upperBoundDate: (7 as unknown) as Date,
      };
      const iteratorView: AsyncIterator<IConnection> = connectionsStore.getIterator(iteratorOptions);

      const expected = [2, 3, 3, 5, 6, 6, 6, 6, 7, 7];
      let current = 0;

      iteratorView.each((str: IConnection) => {
        console.log("Read", str.departureTime);

        expect(expected[current++]).toBe(str.departureTime);
      });

      iteratorView.on("end", () => {
        expect(current).toBe(expected.length);
        done();
      });
    });

  });

});
