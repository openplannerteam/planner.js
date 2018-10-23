import "reflect-metadata";
import ConnectionsFetcherLDFetch from "../fetcher/connections/ld-fetch/ConnectionsFetcherLDFetch";

const fetcher = new ConnectionsFetcherLDFetch();
// iterator.setLowerBound(new Date(2018, 10, 2, 10));

(async () => {

  let i = 0;

  for await (const connection of fetcher) {
    console.log(i++, connection.departureTime);

    if (i === 500) {
      break;
    }
  }

})();
