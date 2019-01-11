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

  const fakeDepartureTimes = [1, 2, 3, 3, 5, 6, 6, 6, 6, 7, 7];
  // @ts-ignore
  const fakeConnections: IConnection[] = fakeDepartureTimes
    .map((departureTime) => ({departureTime}));

  const connectionsStore = new ConnectionsStore();
  for (const connection of fakeConnections) {
    connectionsStore.append(connection);
  }

  it("iterator view: backward / upperBoundDate is loaded & exists in store", (done) => {
    const fetcherConfig: IConnectionsFetcherConfig = {
      backward: true,
      upperBoundDate: (6 as unknown) as Date,
    };
    const iteratorView: AsyncIterator<IConnection> = connectionsStore.getIteratorView(fetcherConfig);

    const expected = [1, 2, 3, 3, 5, 6, 6, 6, 6];
    let current = expected.length - 1;

    iteratorView.each((str: IConnection) => {
      console.log(str.departureTime);
      expect(expected[current--]).toBe(str.departureTime);
    });

    iteratorView.on("end", () => done());
  });

  it("iterator view: backward / upperBoundDate is loaded but doesn\'t exist in store", (done) => {
    const fetcherConfig: IConnectionsFetcherConfig = {
      backward: true,
      upperBoundDate: (4 as unknown) as Date,
    };
    const iteratorView: AsyncIterator<IConnection> = connectionsStore.getIteratorView(fetcherConfig);

    const expected = [1, 2, 3, 3];
    let current = expected.length - 1;

    iteratorView.each((str: IConnection) => {
      console.log(str.departureTime);
      expect(expected[current--]).toBe(str.departureTime);
    });

    iteratorView.on("end", () => done());
  });

  it("iterator view: backward / upperBoundDate isn't loaded", (done) => {
    const fetcherConfig: IConnectionsFetcherConfig = {
      backward: true,
      upperBoundDate: (10 as unknown) as Date,
    };
    const iteratorView: AsyncIterator<IConnection> = connectionsStore.getIteratorView(fetcherConfig);

    const expected = [1, 2, 3, 3];
    let current = expected.length - 1;

    iteratorView.each((str: IConnection) => {
      console.log(str.departureTime);
      expect(expected[current--]).toBe(str.departureTime);
    });

    iteratorView.on("end", () => done());
  });

});
