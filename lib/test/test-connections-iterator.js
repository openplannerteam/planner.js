"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
/*
const ldFetch = new LDFetch({ headers: { Accept: "application/ld+json" } });

const upperBoundDate = new Date();
upperBoundDate.setHours(upperBoundDate.getHours() + 2);

const config = {
  upperBoundDate,
  backward: true,
};

const connectionsFetcher = new ConnectionsFetcherLDFetch(ldFetch);
connectionsFetcher.setTravelMode(TravelMode.Train);
connectionsFetcher.setAccessUrl("https://graph.irail.be/sncb/connections");
connectionsFetcher.setIteratorOptions(config);
// iterator.setLowerBound(new Date(2018, 10, 2, 10));

(async () => {

  console.time("fetch");

  let i = 0;
  let sum = 0;

  for await (const connection of connectionsFetcher) {
    sum += connection.departureDelay || 0;

    if (i++ > 4000) {
      break;
    }
  }
  console.timeEnd("fetch");

})();
*/
//# sourceMappingURL=test-connections-iterator.js.map