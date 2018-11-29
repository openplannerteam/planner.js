import "jest";
import LDFetch from "ldfetch";
import ConnectionsFetcherLDFetch from "../../fetcher/connections/ld-fetch/ConnectionsFetcherLDFetch";
import ConnectionsFetcherNMBSTest from "../../fetcher/connections/tests/ConnectionsFetcherNMBSTest";
import connectionsIngelmunsterGhent from "../../fetcher/connections/tests/data/ingelmunster-ghent";
import connectionsJoining from "../../fetcher/connections/tests/data/joining";
import connectionsSplitting from "../../fetcher/connections/tests/data/splitting";
import StopsFetcherLDFetch from "../../fetcher/stops/ld-fetch/StopsFetcherLDFetch";
import IPath from "../../interfaces/IPath";
import IQuery from "../../interfaces/IQuery";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import LocationResolverDefault from "../../query-runner/LocationResolverDefault";
import QueryRunnerDefault from "../../query-runner/QueryRunnerDefault";
import TravelMode from "../../TravelMode";
import RoadPlannerBirdsEye from "../road/RoadPlannerBirdsEye";
import ReachableStopsFinderBirdsEyeCached from "../stops/ReachableStopsFinderBirdsEyeCached";
import JourneyExtractorDefault from "./JourneyExtractorDefault";
import PublicTransportPlannerCSAProfile from "./PublicTransportPlannerCSAProfile";

describe("[PublicTransportPlannerCSAProfile]", () => {
  describe("mock data", () => {

    describe("basic test", () => {
      let result: IPath [];

      const query: IResolvedQuery = {
        publicTransportOnly: true,
        from: [{ id: "http://irail.be/stations/NMBS/008896925", latitude: 50.914326, longitude: 3.255416 }],
        to: [{ id: "http://irail.be/stations/NMBS/008892007", latitude: 51.035896, longitude: 3.710675 }],
        minimumDepartureTime: new Date("2018-11-06T09:00:00.000Z"),
        maximumArrivalTime: new Date("2018-11-06T19:00:00.000Z"),
        maximumTransfers: 8,
      };

      beforeAll(async () => {
        const ldFetch = new LDFetch({ headers: { Accept: "application/ld+json" } });

        const connectionFetcher = new ConnectionsFetcherNMBSTest(connectionsIngelmunsterGhent);
        connectionFetcher.setConfig({ backward: true });

        const stopsFetcher = new StopsFetcherLDFetch(ldFetch);
        stopsFetcher.setPrefix("http://irail.be/stations/NMBS/");
        stopsFetcher.setAccessUrl("https://irail.be/stations/NMBS");

        const locationResolver = new LocationResolverDefault(stopsFetcher);
        const reachableStopsFinder = new ReachableStopsFinderBirdsEyeCached(stopsFetcher);
        const roadPlanner = new RoadPlannerBirdsEye();
        const journeyExtractor = new JourneyExtractorDefault(
          roadPlanner,
          roadPlanner,
          reachableStopsFinder,
          locationResolver,
        );

        const CSA = new PublicTransportPlannerCSAProfile(
          connectionFetcher,
          locationResolver,
          reachableStopsFinder,
          reachableStopsFinder,
          journeyExtractor,
        );

        result = [];
        for await (const path of CSA.plan(query)) {
          result.push(path);
        }
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

    describe("splitting", () => {
      let result: IPath [];

      const query: IResolvedQuery = {
        publicTransportOnly: true,
        from: [{ id: "http://irail.be/stations/NMBS/008821006" }],
        to: [{ id: "http://irail.be/stations/NMBS/008812005" }],
        minimumDepartureTime: new Date("2017-12-19T15:50:00.000Z"),
        maximumArrivalTime: new Date("2017-12-19T16:50:00.000Z"),
        maximumTransfers: 1,
      };

      beforeAll(async () => {
        const ldFetch = new LDFetch({ headers: { Accept: "application/ld+json" } });

        const connectionFetcher = new ConnectionsFetcherNMBSTest(connectionsSplitting);
        connectionFetcher.setConfig({ backward: true });

        const stopsFetcher = new StopsFetcherLDFetch(ldFetch);
        stopsFetcher.setPrefix("http://irail.be/stations/NMBS/");
        stopsFetcher.setAccessUrl("https://irail.be/stations/NMBS");

        const locationResolver = new LocationResolverDefault(stopsFetcher);
        const reachableStopsFinder = new ReachableStopsFinderBirdsEyeCached(stopsFetcher);
        const roadPlanner = new RoadPlannerBirdsEye();
        const journeyExtractor = new JourneyExtractorDefault(
          roadPlanner,
          roadPlanner,
          reachableStopsFinder,
          locationResolver,
        );

        const CSA = new PublicTransportPlannerCSAProfile(
          connectionFetcher,
          locationResolver,
          reachableStopsFinder,
          reachableStopsFinder,
          journeyExtractor,
        );

        result = [];
        for await (const path of CSA.plan(query)) {
          result.push(path);
        }
      });

      it("Correct departure and arrival stop", () => {
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThanOrEqual(1);

        for (const path of result) {
          expect(path.steps).toBeDefined();

          expect(path.steps.length).toEqual(1);
          expect(path.steps[0]).toBeDefined();

          expect(query.from.map((from) => from.id)).toContain(path.steps[0].startLocation.id);
          expect(query.to.map((to) => to.id)).toContain(path.steps[0].stopLocation.id);
        }
      });
    });

    describe("joining", () => {
      let result: IPath [];

      const query: IResolvedQuery = {
        publicTransportOnly: true,
        from: [{ id: "http://irail.be/stations/NMBS/008812005" }],
        to: [{ id: "http://irail.be/stations/NMBS/008821006" }],
        minimumDepartureTime: new Date("2017-12-19T16:20:00.000Z"),
        maximumArrivalTime: new Date("2017-12-19T16:50:00.000Z"),
        maximumTransfers: 1,
      };

      beforeAll(async () => {
        const ldFetch = new LDFetch({ headers: { Accept: "application/ld+json" } });

        const connectionFetcher = new ConnectionsFetcherNMBSTest(connectionsJoining);
        connectionFetcher.setConfig({ backward: true });

        const stopsFetcher = new StopsFetcherLDFetch(ldFetch);
        stopsFetcher.setPrefix("http://irail.be/stations/NMBS/");
        stopsFetcher.setAccessUrl("https://irail.be/stations/NMBS");

        const locationResolver = new LocationResolverDefault(stopsFetcher);
        const reachableStopsFinder = new ReachableStopsFinderBirdsEyeCached(stopsFetcher);
        const roadPlanner = new RoadPlannerBirdsEye();
        const journeyExtractor = new JourneyExtractorDefault(
          roadPlanner,
          roadPlanner,
          reachableStopsFinder,
          locationResolver,
        );

        const CSA = new PublicTransportPlannerCSAProfile(
          connectionFetcher,
          locationResolver,
          reachableStopsFinder,
          reachableStopsFinder,
          journeyExtractor,
        );

        result = [];
        for await (const path of CSA.plan(query)) {
          result.push(path);
        }
      });

      it("Correct departure and arrival stop", () => {
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThanOrEqual(1);

        for (const path of result) {
          expect(path.steps).toBeDefined();

          expect(path.steps.length).toEqual(1);
          expect(path.steps[0]).toBeDefined();

          expect(query.from.map((from) => from.id)).toContain(path.steps[0].startLocation.id);
          expect(query.to.map((to) => to.id)).toContain(path.steps[0].stopLocation.id);
        }
      });
    });
  });

  describe("real-time data", () => {
    jest.setTimeout(100000);

    const minimumDepartureTime = new Date();
    minimumDepartureTime.setHours(minimumDepartureTime.getHours() + 1);

    const maximumArrivalTime = new Date();
    maximumArrivalTime.setHours(maximumArrivalTime.getHours() + 3);

    const query: IQuery = {
      publicTransportOnly: true,
      from: [
         "http://irail.be/stations/NMBS/008896925", // Ingelmunster
       ],
      to: [
        "http://irail.be/stations/NMBS/008892007", // Antwerpen
      ],
      maximumArrivalTime,
      minimumDepartureTime,
    };
    let result: IPath[];

    beforeAll(async () => {
      const ldFetch = new LDFetch({ headers: { Accept: "application/ld+json" } });

      const connectionFetcher = new ConnectionsFetcherLDFetch(ldFetch);
      connectionFetcher.setTravelMode(TravelMode.Train);
      connectionFetcher.setAccessUrl("https://graph.irail.be/sncb/connections");

      const stopsFetcher = new StopsFetcherLDFetch(ldFetch);
      stopsFetcher.setPrefix("http://irail.be/stations/NMBS/");
      stopsFetcher.setAccessUrl("https://irail.be/stations/NMBS");

      const locationResolver = new LocationResolverDefault(stopsFetcher);
      const reachableStopsFinder = new ReachableStopsFinderBirdsEyeCached(stopsFetcher);
      const roadPlanner = new RoadPlannerBirdsEye();
      const journeyExtractor = new JourneyExtractorDefault(
        roadPlanner,
        roadPlanner,
        reachableStopsFinder,
        locationResolver,
      );

      const CSA = new PublicTransportPlannerCSAProfile(
        connectionFetcher,
        locationResolver,
        reachableStopsFinder,
        reachableStopsFinder,
        journeyExtractor,
      );

      const queryRunner = new QueryRunnerDefault(locationResolver, CSA, roadPlanner);
      result = [];
      for await (const path of queryRunner.run(query)) {
        result.push(path);
      }
    });

    it("Correct departure and arrival stop", () => {
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThanOrEqual(1);

      for (const path of result) {
        expect(path.steps).toBeDefined();

        expect(path.steps.length).toBeGreaterThanOrEqual(1);
        expect(path.steps[0]).toBeDefined();
        expect(path.steps[path.steps.length - 1]).toBeDefined();

        expect(query.from).toContain(path.steps[0].startLocation.id);
        expect(query.to).toContain(path.steps[path.steps.length - 1].stopLocation.id);
      }
    });

    it("Correct departure and arrival time", () => {
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThanOrEqual(1);

      for (const path of result) {
        expect(path.steps).toBeDefined();

        expect(path.steps.length).toBeGreaterThanOrEqual(1);
        expect(path.steps[0]).toBeDefined();
        expect(path.steps[path.steps.length - 1]).toBeDefined();

        let i = path.steps.length - 1;
        while (i >= 0 && path.steps[i].travelMode !== TravelMode.Train) {
          i--;
        }

        let arrivalTime = path.steps[i].stopTime.getTime();
        for (let j = i + 1; j < path.steps.length; j++) {
          arrivalTime += path.steps[j].duration.minimum;
        }

        expect(path.steps[0].startTime.getTime()).toBeGreaterThanOrEqual(minimumDepartureTime.getTime());
        expect(arrivalTime).toBeLessThanOrEqual(maximumArrivalTime.getTime());
      }
    });
  });
});
