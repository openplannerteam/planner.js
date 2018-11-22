import "jest";
import IStop from "../IStop";
import IStopsFetcher from "../IStopsFetcher";
import StopsFetcherDeLijn from "./StopsFetcherDeLijn";

const fetcher: IStopsFetcher = new StopsFetcherDeLijn();

test("[StopsFetcherDeLijn] first stop", async () => {
  jest.setTimeout(15000);

  const stop: IStop = await fetcher.getStopById("https://data.delijn.be/stops/590009");

  expect(stop).toBeDefined();
  expect(stop.name).toEqual("De Vierweg");
});

test("[StopsFetcherDeLijn] second stop", async () => {
  const stop: IStop = await fetcher.getStopById("https://data.delijn.be/stops/219025");

  expect(stop).toBeDefined();
  expect(stop.name).toEqual("Brandweer");
});
