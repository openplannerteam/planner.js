import {AsyncIterator} from "asynciterator";
import "jest";
import IConnection from "../IConnection";
import IConnectionsFetcherConfig from "../IConnectionsFetcherConfig";
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
        .map((departureTime) => ({departureTime}));

      connectionsStore = new ConnectionsStore();
      for (const connection of fakeConnections) {
        connectionsStore.append(connection);
      }

      createIterator = async (backward, lowerBoundDate, upperBoundDate): Promise<AsyncIterator<IConnection>> => {
        const fetcherConfig: IConnectionsFetcherConfig = {
          backward,
        };

        if (lowerBoundDate) {
          fetcherConfig.lowerBoundDate = (lowerBoundDate as unknown) as Date;
        }

        if (upperBoundDate) {
          fetcherConfig.upperBoundDate = (upperBoundDate as unknown) as Date;
        }

        return connectionsStore.getIterator(fetcherConfig);
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

        iteratorView.on("end", () => done());
      });

      it("upperBoundDate is loaded but doesn\'t exist in store", async (done) => {
        const iteratorView = await createIterator(true, null, 4);

        const expected = [1, 2, 3, 3];
        let current = expected.length - 1;

        iteratorView.each((str: IConnection) => {
          expect(expected[current--]).toBe(str.departureTime);
        });

        iteratorView.on("end", () => done());
      });

    });

    describe("forward", () => {

      it("lowerBoundDate is loaded & exists in store", async (done) => {
        const iteratorView = await createIterator(false, 3, 6);

        console.log("a");

        const expected = [3, 3, 5, 6, 6, 6, 6];
        let current = 0;

        console.log("b");

        iteratorView.each((str: IConnection) => {
          console.log(str);
          expect(expected[current++]).toBe(str.departureTime);
        });

        iteratorView.on("end", () => {
          expect(current).toBe(expected.length - 1);
          console.log("c");
          done();
        });
      });

      it("lowerBoundDate is loaded but doesn\'t exist in store", async (done) => {
        const iteratorView = await createIterator(false, 4, null);

        const expected = [1, 2, 3, 3];
        let current = 0;

        iteratorView.each((str: IConnection) => {
          expect(expected[current--]).toBe(str.departureTime);
        });

        iteratorView.on("end", () => done());
      });

    });

  });

  describe("Loaded async", () => {
    jest.setTimeout(10000);

    const fakeDepartureTimes = [1, 2, 3, 3, 5, 6, 6, 6, 6, 7, 7, 8];
    // @ts-ignore
    const fakeConnections: IConnection[] = fakeDepartureTimes
      .map((departureTime) => ({departureTime}));

    const connectionsStore = new ConnectionsStore();

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
      }
    };

    setTimeout(appendNext, 100);

    it("iterator view: backward / upperBoundDate isn't loaded at first", async (done) => {
      const fetcherConfig: IConnectionsFetcherConfig = {
        backward: true,
        upperBoundDate: (7 as unknown) as Date,
      };
      const iteratorView: AsyncIterator<IConnection> = await connectionsStore.getIterator(fetcherConfig);

      const expected = [1, 2, 3, 3, 5, 6, 6, 6, 6, 7, 7];
      let current = expected.length - 1;

      iteratorView.each((str: IConnection) => {
        expect(expected[current--]).toBe(str.departureTime);
      });

      iteratorView.on("end", () => done());
    });

  });

});
