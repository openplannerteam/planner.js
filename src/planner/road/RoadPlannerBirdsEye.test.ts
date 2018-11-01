import "jest";
import Context from "../../Context";
import StopsFetcherNMBS from "../../fetcher/stops/StopsFetcherNMBS";
import IPath from "../../interfaces/IPath";
import LocationResolverDefault from "../../query-runner/LocationResolverDefault";
import TYPES from "../../types";
import IRoadPlanner from "./IRoadPlanner";
import RoadPlannerBirdsEye from "./RoadPlannerBirdsEye";

const dummyContext = {
  getContainer() {
    return {
      getAll(type) {
        if (type === TYPES.StopsFetcher) {
          return [new StopsFetcherNMBS()];
        }
      },
    };
  },
};

const planner: IRoadPlanner = new RoadPlannerBirdsEye();
const locationResolver = new LocationResolverDefault(dummyContext as Context);

test("[RoadPlannerBirdsEye] distance between stops", async () => {

  const kortrijkLocation = await locationResolver.resolve({id: "http://irail.be/stations/NMBS/008896008"});
  const ghentLocation = await locationResolver.resolve({id: "http://irail.be/stations/NMBS/008892007"});

  const result: IPath[] = await planner.plan({
    from: [kortrijkLocation], // Kortrijk
    to: [ghentLocation], // Ghent-Sint-Pieters,
    minimumWalkingSpeed: 3,
    maximumWalkingSpeed: 6,
  });

  expect(result).toHaveLength(1);

  // todo test result[0].steps
});
