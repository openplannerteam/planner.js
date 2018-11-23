import LDFetch from "ldfetch";
import "reflect-metadata";
import ConnectionsFetcherLDFetch from "../fetcher/connections/ld-fetch/ConnectionsFetcherLDFetch";
import TravelMode from "../TravelMode";

const ldFetch = new LDFetch({ headers: { Accept: "application/ld+json" } });

const connectionsFetcher = new ConnectionsFetcherLDFetch(ldFetch);
connectionsFetcher.setTravelMode(TravelMode.Train);
connectionsFetcher.setAccessUrl("https://irail.be/stations/NMBS");

connectionsFetcher.setConfig({
  lowerBoundDate: new Date(),
  upperBoundDate: new Date(),
  backward: false,
});
// iterator.setLowerBound(new Date(2018, 10, 2, 10));

(async () => {

  console.time("fetch");

  let i = 0;

  for await (const connection of connectionsFetcher) {
    console.log(i++, connection.id, connection.departureTime);

    if (i++ > 1000) {
      break;
    }
  }
  console.timeEnd("fetch");

})();
