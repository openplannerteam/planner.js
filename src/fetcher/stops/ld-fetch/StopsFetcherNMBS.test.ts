import "jest";
import IStop from "../IStop";
import IStopsFetcher from "../IStopsFetcher";
import StopsFetcherNMBS from "./StopsFetcherNMBS";

test("[StopsFetcherNMBS]", async () => {
  const fetcher: IStopsFetcher = new StopsFetcherNMBS();
  const stop: IStop = await fetcher.getStopById("http://irail.be/stations/NMBS/008896008");

  console.log(stop);

  expect(stop).toBeDefined();
  expect(stop.name).toEqual("Kortrijk");
});
