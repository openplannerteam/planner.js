import "jest";
import LDFetch from "ldfetch";
import Defaults from "../../Defaults";
import ConnectionsFetcherNMBSTest from "../../fetcher/connections/tests/ConnectionsFetcherNMBSTest";
import connectionsIngelmunsterGhent from "../../fetcher/connections/tests/data/ingelmunster-ghent";
import connectionsJoining from "../../fetcher/connections/tests/data/joining";
import connectionsSplitting from "../../fetcher/connections/tests/data/splitting";
import StopsFetcherLDFetch from "../../fetcher/stops/ld-fetch/StopsFetcherLDFetch";
import IPath from "../../interfaces/IPath";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import LocationResolverDefault from "../../query-runner/LocationResolverDefault";
import Iterators from "../../util/Iterators";
import ReachableStopsFinderBirdsEyeCached from "../stops/ReachableStopsFinderBirdsEyeCached";
import CSAEarliestArrival from "./CSAEarliestArrival";
import JourneyExtractorEarliestArrivalTime from "./JourneyExtractorEarliestArrivalTime";

describe("[PublicTransportPlannerCSAProfile]", () => {
  describe("mock data", () => {
    jest.setTimeout(100000);

    const createCSA = (connections) => {
      const ldFetch = new LDFetch({ headers: { Accept: "application/ld+json" } });

      const connectionFetcher = new ConnectionsFetcherNMBSTest(connections);
      connectionFetcher.setConfig({ backward: false });

      const stopsFetcher = new StopsFetcherLDFetch(ldFetch);
      stopsFetcher.setAccessUrl("https://irail.be/stations/NMBS");

      const locationResolver = new LocationResolverDefault(stopsFetcher);
      const reachableStopsFinder = new ReachableStopsFinderBirdsEyeCached(stopsFetcher);
      const journeyExtractor = new JourneyExtractorEarliestArrivalTime(
        locationResolver,
      );

      return new CSAEarliestArrival(
        connectionFetcher,
        locationResolver,
        reachableStopsFinder,
        reachableStopsFinder,
        reachableStopsFinder,
        journeyExtractor,
      );
    };

    describe("basic test", () => {
      let result: IPath[];

      const query: IResolvedQuery = {
        publicTransportOnly: true,
        from: [{latitude: 50.914326, longitude: 3.255415, id: "http://irail.be/stations/NMBS/008896925" }],
        to: [{ latitude: 51.035896, longitude: 3.710875, id: "http://irail.be/stations/NMBS/008892007" }],
        minimumDepartureTime: new Date("2018-11-06T09:00:00.000Z"),
        maximumArrivalTime: new Date("2018-11-06T19:00:00.000Z"),
        maximumTransfers: 8,
        minimumWalkingSpeed: Defaults.defaultMinimumWalkingSpeed,
        maximumWalkingSpeed: Defaults.defaultMaximumWalkingSpeed,
        maximumTransferDuration: Defaults.defaultMaximumTransferDuration,
      };

      beforeAll(async () => {
        const CSA = createCSA(connectionsIngelmunsterGhent);
        const iterator = await CSA.plan(query);
        result = await Iterators.toArray(iterator);
      });

      it("Correct departure and arrival stop", () => {
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
      let result: IPath[];

      const query: IResolvedQuery = {
        publicTransportOnly: true,
        from: [{
          id: "http://irail.be/stations/NMBS/008821006",
          latitude: 51.2172,
          longitude: 4.421101,
        }],
        to: [{
          id: "http://irail.be/stations/NMBS/008812005",
          latitude: 50.859663,
          longitude: 4.360846,
        }],
        minimumDepartureTime: new Date("2017-12-19T15:50:00.000Z"),
        maximumArrivalTime: new Date("2017-12-19T16:50:00.000Z"),
        maximumTransfers: 1,
        minimumWalkingSpeed: Defaults.defaultMinimumWalkingSpeed,
        maximumWalkingSpeed: Defaults.defaultMaximumWalkingSpeed,
        maximumTransferDuration: Defaults.defaultMaximumTransferDuration,
      };

      beforeAll(async () => {
        const CSA = createCSA(connectionsSplitting);
        const iterator = await CSA.plan(query);
        result = await Iterators.toArray(iterator);
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
      let result: IPath[];

      const query: IResolvedQuery = {
        publicTransportOnly: true,
        from: [{
          id: "http://irail.be/stations/NMBS/008812005",
          latitude: 50.859663,
          longitude: 4.360846,
        }],
        to: [{
          id: "http://irail.be/stations/NMBS/008821006",
          latitude: 51.2172,
          longitude: 4.421101,
        }],
        minimumDepartureTime: new Date("2017-12-19T16:20:00.000Z"),
        maximumArrivalTime: new Date("2017-12-19T16:50:00.000Z"),
        maximumTransfers: 1,
        minimumWalkingSpeed: Defaults.defaultMinimumWalkingSpeed,
        maximumWalkingSpeed: Defaults.defaultMaximumWalkingSpeed,
        maximumTransferDuration: Defaults.defaultMaximumTransferDuration,
      };

      beforeAll(async () => {
        const CSA = createCSA(connectionsJoining);
        const iterator = await CSA.plan(query);
        result = await Iterators.toArray(iterator);
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
});
