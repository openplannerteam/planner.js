import "jest";
import LdFetch from "ldfetch";
import TravelMode from "../../../TravelMode";
import ConnectionsIteratorLDFetch from "./ConnectionsIteratorLDFetch";

const CONNECTIONS_TO_LOAD = 200; // Should be more than contained on first page

test("[ConnectionsIteratorLDFetch] iterate forwards", async () => {

  const config = {
    backward: false,
    lowerBoundDate: new Date(2018, 10, 2, 10),
  };
  const iterator = new ConnectionsIteratorLDFetch(
    "https://graph.irail.be/sncb/connections",
    TravelMode.Train,
    new LdFetch(),
    config,
  );

  const dummyIterable = {
    [Symbol.asyncIterator]: () => iterator,
  };

  let i = 0;
  let lastConnection;

  for await (const connection of dummyIterable) {

    if (!lastConnection) {
      lastConnection = connection;
      continue;
    }

    expect(connection.departureTime.valueOf()).toBeGreaterThanOrEqual(lastConnection.departureTime.valueOf());

    lastConnection = connection;

    if (i++ === CONNECTIONS_TO_LOAD) {
        break;
      }
    }
});
