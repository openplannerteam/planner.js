import "jest";
import IStopsFetcher from "../../fetcher/stops/IStopsFetcher";
import StopsFetcherNMBSLDFetch from "../../fetcher/stops/StopsFetcherNMBSLDFetch";
import IPath from "../../interfaces/IPath";
import IRoadPlanner from "./IRoadPlanner";
import RoadPlannerBirdsEye from "./RoadPlannerBirdsEye";

test("[StopsFetcherNMBSLDFetch] distance between stops", async () => {
  const stopsFetcher: IStopsFetcher = new StopsFetcherNMBSLDFetch();
  const planner: IRoadPlanner = new RoadPlannerBirdsEye(stopsFetcher);

  const result: IPath[] = await planner.plan({
    from: [{id: "http://irail.be/stations/NMBS/008896008"}], // Kortrijk
    to: [{id: "http://irail.be/stations/NMBS/008892007"}], // Ghent-Sint-Pieters
  });

  expect(result).toHaveLength(1);

  const {distance} = result[0];

  expect(distance).toBeGreaterThan(39);
  expect(distance).toBeLessThan(40);
});
