import "jest";
import ConnectionsFetcherNMBS from "../../fetcher/connections/ld-fetch/ConnectionsFetcherNMBS";
import connections from "../../fetcher/connections/tests/connection-data";
import ConnectionsFetcherNMBSTest from "../../fetcher/connections/tests/ConnectionsFetcherNMBSTest";
import StopsFetcherNMBS from "../../fetcher/stops/ld-fetch/StopsFetcherNMBS";
import IPath from "../../interfaces/IPath";
import IQuery from "../../interfaces/IQuery";
import IQueryResult from "../../interfaces/IQueryResult";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import LocationResolverDefault from "../../query-runner/LocationResolverDefault";
import QueryRunnerDefault from "../../query-runner/QueryRunnerDefault";
import TravelMode from "../../TravelMode";
import RoadPlannerBirdsEye from "../road/RoadPlannerBirdsEye";
import ReachableStopsFinderBirdsEye from "../stops/ReachableStopsFinderBirdsEye";
import PublicTransportPlannerCSAProfile from "./PublicTransportPlannerCSAProfile";

describe("[PublicTransportPlannerCSAProfile]", () => {
  describe("mock data", () => {
    let result: IPath [];

    const query: IResolvedQuery = {
      publicTransportOnly: true,
      from: [{id: "http://irail.be/stations/NMBS/008896925", latitude: 50.914326, longitude: 3.255416}],
      to: [{id: "http://irail.be/stations/NMBS/008892007", latitude: 51.035896, longitude: 3.710675}],
      minimumDepartureTime: new Date("2018-11-06T09:00:00.000Z"),
      maximumArrivalTime: new Date("2018-11-06T19:00:00.000Z"),
      maximumLegs: 8,
    };

    beforeAll(async () => {
      const connectionFetcher = new ConnectionsFetcherNMBSTest(connections);
      connectionFetcher.setConfig({backward: true});

      const roadPlanner = new RoadPlannerBirdsEye();
      const stopsFetcher = new StopsFetcherNMBS();
      const locationResolver = new LocationResolverDefault(stopsFetcher);
      const reachableStopsFinder = new ReachableStopsFinderBirdsEye(stopsFetcher);
      const CSA = new PublicTransportPlannerCSAProfile(
        connectionFetcher,
        roadPlanner,
        locationResolver,
        reachableStopsFinder,
      );

      result = await CSA.plan(query);
    });

    it("Correct departure and arrival stop", async () => {
      expect(result).toBeDefined();

      for (const path of result) {
        expect(path.steps).toBeDefined();
        expect(path.steps[0]).toBeDefined();
        expect(query.from.map((from) => from.id)).toContain(path.steps[0].startLocation.id);
        expect(query.to.map((to) => to.id)).toContain(path.steps[path.steps.length - 1].stopLocation.id);
      }
    });
  });

  describe("real-time data", () => {
    jest.setTimeout(90000);

    const now = new Date();
    const nowPlusTwoHours = new Date();
    nowPlusTwoHours.setHours(nowPlusTwoHours.getHours() + 4);

    const query: IQuery = {
      publicTransportOnly: true,
      from: [
        "http://irail.be/stations/NMBS/008896925", // Ingelmunster
      ],
      to: [
        "http://irail.be/stations/NMBS/008821006", // Antwerpen-Centraal
      ],
      maximumArrivalTime: nowPlusTwoHours,
    };
    let result: IQueryResult;

    beforeAll(async () => {
      const connectionFetcher = new ConnectionsFetcherNMBS();
      const roadPlanner = new RoadPlannerBirdsEye();
      const stopsFetcher = new StopsFetcherNMBS();
      const locationResolver = new LocationResolverDefault(stopsFetcher);
      const reachableStopsFinder = new ReachableStopsFinderBirdsEye(stopsFetcher);
      const CSA = new PublicTransportPlannerCSAProfile(
        connectionFetcher,
        roadPlanner,
        locationResolver,
        reachableStopsFinder,
      );

      const queryRunner = new QueryRunnerDefault(locationResolver, CSA, roadPlanner);
      result = await queryRunner.run(query);
    });

    it("Correct departure and arrival stop", () => {
      expect(result).toBeDefined();
      expect(result.paths).toBeDefined();

      for (const path of result.paths) {
        expect(path.steps).toBeDefined();

        expect(path.steps.length).toBeGreaterThanOrEqual(0);
        expect(path.steps[0]).toBeDefined();
        expect(path.steps[path.steps.length - 1]).toBeDefined();

        expect(query.from).toContain(path.steps[0].startLocation.id);
        expect(query.to).toContain(path.steps[path.steps.length - 1].stopLocation.id);
      }
    });

    it("Correct departure and arrival time", () => {
      expect(result).toBeDefined();
      expect(result.paths).toBeDefined();

      for (const path of result.paths) {
        expect(path.steps).toBeDefined();

        expect(path.steps.length).toBeGreaterThanOrEqual(0);
        expect(path.steps[0]).toBeDefined();
        expect(path.steps[path.steps.length - 1]).toBeDefined();

        let i = path.steps.length - 1;
        while (i >= 0 && path.steps[i].travelMode !== TravelMode.Train) {
          i--;
        }

        let arrivalTime = path.steps[i].stopTime.getTime();
        for (let j = i + 1 ; j < path.steps.length ; j++) {
          arrivalTime += path.steps[j].duration.minimum;
        }

        expect(path.steps[0].startTime.getTime()).toBeGreaterThanOrEqual(now.getTime());
        expect(arrivalTime).toBeLessThanOrEqual(nowPlusTwoHours.getTime());
      }
    });
  });

});