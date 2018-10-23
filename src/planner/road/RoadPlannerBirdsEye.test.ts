import "jest";
import IStopsFetcher from "../../fetcher/stops/IStopsFetcher";
import StopsFetcherNMBSLDFetch from "../../fetcher/stops/StopsFetcherNMBSLDFetch";
import IJourney from "../IJourney";
import IRoadPlanner from "./IRoadPlanner";
import RoadPlannerBirdsEye from "./RoadPlannerBirdsEye";

test("[StopsFetcherNMBSLDFetch] distance between stops", async () => {
  const stopsFetcher: IStopsFetcher = new StopsFetcherNMBSLDFetch();
  const planner: IRoadPlanner = new RoadPlannerBirdsEye(stopsFetcher);

  const result: IJourney[] = await planner.plan({
    from: "http://irail.be/stations/NMBS/008896008", // Kortrijk
    to: "http://irail.be/stations/NMBS/008892007", // Ghent-Sint-Pieters
  });

  expect(result).toHaveLength(1);

  const {distance} = result[0];

  expect(distance).toBeGreaterThan(39);
  expect(distance).toBeLessThan(40);
});
