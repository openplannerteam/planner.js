import "jest";
import Context from "../Context";
import StopsFetcherNMBSLDFetch from "../fetcher/stops/StopsFetcherNMBSLDFetch";
import TYPES from "../types";
import LocationResolverDefault from "./LocationResolverDefault";

const dummyContext = {
  getContainer() {
    return {
      getAll(type) {
        if (type === TYPES.StopsFetcher) {
          return [new StopsFetcherNMBSLDFetch()];
        }
      },
    };
  },
};

const locationResolver = new LocationResolverDefault(dummyContext as Context);

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

test("[LocationResolverDefault] Input {longitude: ..., latitude: ...}", async () => {

  const location = await locationResolver.resolve(
    { latitude: 50.824506, longitude: 3.264549 },
    );

  expect(location).toBeDefined();
  expect(location.latitude).toBeCloseTo(50.82, 2);
});

test("[LocationResolverDefault] Input {address: '(some address)'}", async () => {

  const location = await locationResolver.resolve(
    { address: "Brussels" },
  );

  expect(location).toBeDefined();
  expect(location.latitude).toBeCloseTo(50.85, 2);
});

test("[LocationResolverDefault] Input '(some address)'", async () => {

  const location = await locationResolver.resolve(
    "Brussels",
  );

  expect(location).toBeDefined();
  expect(location.latitude).toBeCloseTo(50.85, 2);
});
