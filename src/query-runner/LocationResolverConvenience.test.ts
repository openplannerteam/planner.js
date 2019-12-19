import "jest";
import LDFetch from "ldfetch";
import StopsFetcherLDFetch from "../fetcher/stops/ld-fetch/StopsFetcherLDFetch";
import LocationResolverConvenience from "./LocationResolverConvenience";

const ldFetch = new LDFetch({ headers: { Accept: "application/ld+json" } });

const stopsFetcher = new StopsFetcherLDFetch(ldFetch);
stopsFetcher.setAccessUrl("https://irail.be/stations/NMBS");

const locationResolver = new LocationResolverConvenience(stopsFetcher);

describe("[LocationResolverConvenience]", () => {

  it("Input 'Kortrijk' (exact stop name)", async () => {

    const location = await locationResolver.resolve("Kortrijk");

    expect(location).toBeDefined();
    expect(location.latitude).toBeCloseTo(50.82, 2);
  });

  it("Input 'Narnia' (non-existent stop name)", async () => {
    expect.assertions(1);
    expect(locationResolver.resolve(
      "Narnia",
    )).rejects.toBeDefined();
  });

  it("Input {id: 'http://...'}", async () => {

    const location = await locationResolver.resolve(
      { id: "http://irail.be/stations/NMBS/008896008" },
    );

    expect(location).toBeDefined();
    expect(location.latitude).toBeCloseTo(50.82, 2);
  });

  it("Input 'http://...'", async () => {

    const location = await locationResolver.resolve(
      "http://irail.be/stations/NMBS/008896008",
    );

    expect(location).toBeDefined();
    expect(location.latitude).toBeCloseTo(50.82, 2);
  });

  it("Input {longitude: ..., latitude: ...}", async () => {

    const location = await locationResolver.resolve(
      { latitude: 50.824506, longitude: 3.264549 },
    );

    expect(location).toBeDefined();
    expect(location.latitude).toBeCloseTo(50.82, 2);
  });

});
