import LdFetch from "ldfetch";
import ConnectionsIteratorLDFetch from "../fetcher/connections/ld-fetch/ConnectionsIteratorLDFetch";

const config = { backward: false };
const iterator = new ConnectionsIteratorLDFetch("https://graph.irail.be/sncb/connections", new LdFetch(), config);
iterator.setLowerBound(new Date(2018, 10, 2, 10));

const dummyIterable = {
  [Symbol.asyncIterator]: () => iterator,
};

(async () => {

  let i = 0;

  for await (const connection of dummyIterable) {
    console.log(i++, connection.departureTime);

    if (i === 500) {
      break;
    }
  }

})();
