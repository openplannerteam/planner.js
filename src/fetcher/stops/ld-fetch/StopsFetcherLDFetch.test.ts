import "jest";
import IStop from "../IStop";
import IStopsFetcher from "../IStopsFetcher";
import StopsFetcherLDFetch from "./StopsFetcherLDFetch";

const DE_LIJN_STOPS_URLS = [
  "http://openplanner.ilabt.imec.be/delijn/Antwerpen/stops",
  "http://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/stops",
  "http://openplanner.ilabt.imec.be/delijn/West-Vlaanderen/stops",
  "http://openplanner.ilabt.imec.be/delijn/Vlaams-Brabant/stops",
  "http://openplanner.ilabt.imec.be/delijn/Limburg/stops",
];

const deLijnFetcher: IStopsFetcher = new StopsFetcherLDFetch(
  "https://data.delijn.be/stops/",
  DE_LIJN_STOPS_URLS,
);

const nmbsFetcher: IStopsFetcher = new StopsFetcherLDFetch(
  "http://irail.be/stations/NMBS/",
  ["https://irail.be/stations/NMBS"],
);

test("[StopsFetcherLDFetch] De Lijn first stop", async () => {
  jest.setTimeout(15000);

  const stop: IStop = await deLijnFetcher.getStopById("https://data.delijn.be/stops/590009");

  expect(stop).toBeDefined();
  expect(stop.name).toEqual("De Vierweg");
});

test("[StopsFetcherLDFetch] De Lijn second stop", async () => {
  const stop: IStop = await deLijnFetcher.getStopById("https://data.delijn.be/stops/219025");

  expect(stop).toBeDefined();
  expect(stop.name).toEqual("Brandweer");
});

test("[StopsFetcherLDFetch] NMBS", async () => {
  const stop: IStop = await nmbsFetcher.getStopById("http://irail.be/stations/NMBS/008896008");

  expect(stop).toBeDefined();
  expect(stop.name).toEqual("Kortrijk");
});
