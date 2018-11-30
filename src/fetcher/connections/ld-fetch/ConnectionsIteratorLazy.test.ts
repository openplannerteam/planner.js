import "jest";
import LdFetch from "ldfetch";
import TravelMode from "../../../TravelMode";
import IConnection from "../IConnection";
import ConnectionsIteratorLazy from "./ConnectionsIteratorLazy";

const CONNECTIONS_TO_LOAD = 500; // Should be more than contained on first page

test("[ConnectionsIteratorLazy] iterate forwards", (done) => {
  jest.setTimeout(90000);

  const config = {
    backward: false,
    lowerBoundDate: new Date(2018, 10, 22, 10),
  };
  const iterator = new ConnectionsIteratorLazy(
    "https://graph.irail.be/sncb/connections",
    TravelMode.Train,
    new LdFetch(),
    config,
  );

  let i = 0;
  let lastConnection: IConnection;

  iterator.on("readable", () => {
    lastConnection = iterator.read();
    let connection = iterator.read();

    while (connection && i++ < CONNECTIONS_TO_LOAD) {

      expect(connection.departureTime.valueOf()).toBeGreaterThanOrEqual(lastConnection.departureTime.valueOf());

      lastConnection = connection;
      connection = iterator.read();
    }

    if (i >= CONNECTIONS_TO_LOAD) {
      iterator.close();
      done();
    }
  });

});
