import "reflect-metadata";
import ConnectionsFetcherDeLijn from "../fetcher/connections/ld-fetch/ConnectionsFetcherDeLijn";
import ConnectionsFetcherLDFetch from "../fetcher/connections/ld-fetch/ConnectionsFetcherLDFetch";
import ConnectionsFetcherNMBS from "../fetcher/connections/ld-fetch/ConnectionsFetcherNMBS";

const fetcher = new ConnectionsFetcherDeLijn();
// iterator.setLowerBound(new Date(2018, 10, 2, 10));
(async () => {

  console.time("fetch");

  let i = 0;

  for await (const connection of fetcher) {
    //console.log(i++, connection.departureTime);

    if (i++ === 10000) {
      break;
    }
  }
  console.timeEnd("fetch");

})();
