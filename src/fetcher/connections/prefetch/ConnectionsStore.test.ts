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

  describe("All loaded", () => {

    const fakeDepartureTimes = [1, 2, 3, 3, 5, 6, 6, 6, 6, 7, 7];
    // @ts-ignore
    const fakeConnections: IConnection[] = fakeDepartureTimes
      .map((departureTime) => ({departureTime}));

    const connectionsStore = new ConnectionsStore();
    for (const connection of fakeConnections) {
      connectionsStore.append(connection);
    }

    it("iterator view: backward / upperBoundDate is loaded & exists in store", async (done) => {
      const fetcherConfig: IConnectionsFetcherConfig = {
        backward: true,
        upperBoundDate: (6 as unknown) as Date,
      };
      const iteratorView: AsyncIterator<IConnection> = await connectionsStore.getIteratorView(fetcherConfig);

      const expected = [1, 2, 3, 3, 5, 6, 6, 6, 6];
      let current = expected.length - 1;

      iteratorView.each((str: IConnection) => {
        expect(expected[current--]).toBe(str.departureTime);
      });

      iteratorView.on("end", () => done());
    });

    it("iterator view: backward / upperBoundDate is loaded but doesn\'t exist in store", async (done) => {
      const fetcherConfig: IConnectionsFetcherConfig = {
        backward: true,
        upperBoundDate: (4 as unknown) as Date,
      };
      const iteratorView: AsyncIterator<IConnection> = await connectionsStore.getIteratorView(fetcherConfig);

      const expected = [1, 2, 3, 3];
      let current = expected.length - 1;

      iteratorView.each((str: IConnection) => {
        expect(expected[current--]).toBe(str.departureTime);
      });

      iteratorView.on("end", () => done());
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
      const iteratorView: AsyncIterator<IConnection> = await connectionsStore.getIteratorView(fetcherConfig);

      const expected = [1, 2, 3, 3, 5, 6, 6, 6, 6, 7, 7];
      let current = expected.length - 1;

      iteratorView.each((str: IConnection) => {
        expect(expected[current--]).toBe(str.departureTime);
      });

      iteratorView.on("end", () => done());
    });

  });

});
