import "jest";
import IStop from "./IStop";
import IStopsFetcher from "./IStopsFetcher";
import StopsFetcherNMBSLDFetch from "./StopsFetcherNMBSLDFetch";

test("[StopsFetcherNMBSLDFetch]", async () => {
  const fetcher: IStopsFetcher = new StopsFetcherNMBSLDFetch();
  const stop: IStop = await fetcher.getStopById("http://irail.be/stations/NMBS/008896008");

  console.log(stop);

  expect(stop).toBeDefined();
  expect(stop.name).toEqual("Kortrijk");
});
