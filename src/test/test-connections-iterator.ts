import LDFetch from "ldfetch";
import "reflect-metadata";
import ConnectionsFetcherNMBS from "../fetcher/connections/ld-fetch/ConnectionsFetcherNMBS";

const fetcher = new ConnectionsFetcherNMBS(new LDFetch());
// const fetcher = container.getTagged<IConnectionsFetcher>(TYPES.ConnectionsFetcher, "type", "merge");
fetcher.setConfig({
  lowerBoundDate: new Date(),
  upperBoundDate: new Date(),
  backward: false,
});
// iterator.setLowerBound(new Date(2018, 10, 2, 10));

(async () => {

  console.time("fetch");

  let i = 0;

  for await (const connection of fetcher) {
    console.log(i++, connection.id, connection.departureTime);

    if (i++ > 1000) {
      break;
    }
  }
  console.timeEnd("fetch");

})();
