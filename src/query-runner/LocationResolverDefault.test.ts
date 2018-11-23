import "jest";
import StopsFetcherLDFetch from "../fetcher/stops/ld-fetch/StopsFetcherLDFetch";
import LocationResolverDefault from "./LocationResolverDefault";

const stopsFetcher = new StopsFetcherLDFetch("http://irail.be/stations/NMBS/", ["https://irail.be/stations/NMBS"]);
const locationResolver = new LocationResolverDefault(stopsFetcher);

test("[LocationResolverDefault] Input {id: 'http://...'}", async () => {

  const location = await locationResolver.resolve(
    { id: "http://irail.be/stations/NMBS/008896008" },
  );

  expect(location).toBeDefined();
  expect(location.latitude).toBeCloseTo(50.82, 2);
});

test("[LocationResolverDefault] Input 'http://...'", async () => {

  const location = await locationResolver.resolve(
    "http://irail.be/stations/NMBS/008896008",
  );

  expect(location).toBeDefined();
  expect(location.latitude).toBeCloseTo(50.82, 2);
});

test("[LocationResolverDefault] Input '...not an ID...'", async () => {
  expect.assertions(1);
  expect(locationResolver.resolve(
    "random string",
  )).rejects.toBeDefined();
});

test("[LocationResolverDefault] Input {longitude: ..., latitude: ...}", async () => {

  const location = await locationResolver.resolve(
    { latitude: 50.824506, longitude: 3.264549 },
  );

  expect(location).toBeDefined();
  expect(location.latitude).toBeCloseTo(50.82, 2);
});
