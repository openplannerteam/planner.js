import "jest";
import LDFetch from "ldfetch";
import IStop from "../IStop";
import StopsFetcherLDFetch from "./StopsFetcherLDFetch";

const DE_LIJN_STOPS_URLS = [
  "http://openplanner.ilabt.imec.be/delijn/Antwerpen/stops",
  "http://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/stops",
  "http://openplanner.ilabt.imec.be/delijn/West-Vlaanderen/stops",
  "http://openplanner.ilabt.imec.be/delijn/Vlaams-Brabant/stops",
  "http://openplanner.ilabt.imec.be/delijn/Limburg/stops",
];

const ldFetch = new LDFetch({ headers: { Accept: "application/ld+json" } });

const deLijnFetcher = new StopsFetcherLDFetch(ldFetch);
deLijnFetcher.setPrefix("https://data.delijn.be/stops/");
deLijnFetcher.setAccessUrl(DE_LIJN_STOPS_URLS[2]);

const nmbsFetcher = new StopsFetcherLDFetch(ldFetch);
nmbsFetcher.setPrefix("http://irail.be/stations/NMBS/");
nmbsFetcher.setAccessUrl("https://irail.be/stations/NMBS");

test("[StopsFetcherLDFetch] De Lijn first stop", async () => {
  jest.setTimeout(15000);

  const stop: IStop = await deLijnFetcher.getStopById("https://data.delijn.be/stops/590009");

  expect(stop).toBeDefined();
  expect(stop.name).toEqual("De Vierweg");
});

// test("[StopsFetcherLDFetch] De Lijn second stop", async () => {
//   const stop: IStop = await deLijnFetcher.getStopById("https://data.delijn.be/stops/219025");
//
//   expect(stop).toBeDefined();
//   expect(stop.name).toEqual("Brandweer");
// });

test("[StopsFetcherLDFetch] De Lijn second stop", async () => {
  const stop: IStop = await deLijnFetcher.getStopById("https://data.delijn.be/stops/500050");

  expect(stop).toBeDefined();
  expect(stop.name).toEqual("Station perron 10");
});

test("[StopsFetcherLDFetch] NMBS", async () => {
  const stop: IStop = await nmbsFetcher.getStopById("http://irail.be/stations/NMBS/008896008");

  expect(stop).toBeDefined();
  expect(stop.name).toEqual("Kortrijk");
});
