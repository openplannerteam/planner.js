import "jest";
import LDFetch from "ldfetch";
import Defaults from "../../Defaults";
import TravelMode from "../../enums/TravelMode";
import ConnectionsFetcherLazy from "../../fetcher/connections/lazy/ConnectionsFetcherLazy";
import ConnectionsFetcherNMBSTest from "../../fetcher/connections/tests/ConnectionsFetcherNMBSTest";
import connectionsIngelmunsterGhent from "../../fetcher/connections/tests/data/ingelmunster-ghent";
import connectionsJoining from "../../fetcher/connections/tests/data/joining";
import connectionsSplitting from "../../fetcher/connections/tests/data/splitting";
import StopsFetcherLDFetch from "../../fetcher/stops/ld-fetch/StopsFetcherLDFetch";
import IPath from "../../interfaces/IPath";
import IQuery from "../../interfaces/IQuery";
import IStep from "../../interfaces/IStep";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import LocationResolverDefault from "../../query-runner/LocationResolverDefault";
import QueryRunnerDefault from "../../query-runner/QueryRunnerDefault";
import Iterators from "../../util/Iterators";
import ReachableStopsFinderBirdsEyeCached from "../stops/ReachableStopsFinderBirdsEyeCached";
import CSAProfile from "./CSAProfile";
import JourneyExtractorProfile from "./JourneyExtractorProfile";

describe("[PublicTransportPlannerCSAProfile]", () => {
  describe("mock data", () => {
    jest.setTimeout(100000);

    const createCSA = (connections) => {
      const ldFetch = new LDFetch({ headers: { Accept: "application/ld+json" } });

      const connectionFetcher = new ConnectionsFetcherNMBSTest(connections);
      connectionFetcher.setIteratorOptions({ backward: true });

      const stopsFetcher = new StopsFetcherLDFetch(ldFetch);
      stopsFetcher.setAccessUrl("https://irail.be/stations/NMBS");

      const locationResolver = new LocationResolverDefault(stopsFetcher);
      const reachableStopsFinder = new ReachableStopsFinderBirdsEyeCached(stopsFetcher);
      const journeyExtractor = new JourneyExtractorProfile(
        locationResolver,
      );

      return new CSAProfile(
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
        from: [{latitude: 50.914326, longitude: 3.255415 }],
        to: [{ latitude: 51.035896, longitude: 3.710875 }],
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

  describe("real-time data", () => {
    const createQueryRunner = () => {
      const ldFetch = new LDFetch({ headers: { Accept: "application/ld+json" } });

      const connectionFetcher = new ConnectionsFetcherLazy(ldFetch);
      connectionFetcher.setTravelMode(TravelMode.Train);
      connectionFetcher.setAccessUrl("https://graph.irail.be/sncb/connections");

      const stopsFetcher = new StopsFetcherLDFetch(ldFetch);
      stopsFetcher.setAccessUrl("https://irail.be/stations/NMBS");

      const locationResolver = new LocationResolverDefault(stopsFetcher);
      const reachableStopsFinder = new ReachableStopsFinderBirdsEyeCached(stopsFetcher);
      const journeyExtractor = new JourneyExtractorProfile(
        locationResolver,
      );

      const CSA = new CSAProfile(
        connectionFetcher,
        locationResolver,
        reachableStopsFinder,
        reachableStopsFinder,
        reachableStopsFinder,
        journeyExtractor,
      );

      return new QueryRunnerDefault(locationResolver, CSA, undefined);
    };

    const checkStops = (result, query) => {
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThanOrEqual(1);

      for (const path of result) {
        expect(path.steps).toBeDefined();

        expect(path.steps.length).toBeGreaterThanOrEqual(1);

        let currentLocation = query.from;
        path.steps.forEach((step: IStep) => {
          expect(step).toBeDefined();
          expect(currentLocation).toEqual(step.startLocation.id);
          currentLocation = step.stopLocation.id;
        });

        expect(query.to).toEqual(currentLocation);
      }
    };

    const checkTimes = (result, minimumDepartureTime, maximumArrivalTime) => {
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThanOrEqual(1);

      for (const path of result) {
        expect(path.steps).toBeDefined();

        expect(path.steps.length).toBeGreaterThanOrEqual(1);
        expect(path.steps[0]).toBeDefined();
        expect(path.steps[path.steps.length - 1]).toBeDefined();

        let currentTime = minimumDepartureTime.getTime();
        path.steps.forEach((step: IStep) => {
          expect(step).toBeDefined();
          if (step.travelMode === TravelMode.Walking) {
            currentTime += step.duration.minimum;
          } else {
            expect(currentTime).toBeLessThanOrEqual(step.startTime.getTime());
            currentTime = step.stopTime.getTime();
          }
        });

        expect(path.steps[0].startTime.getTime()).toBeGreaterThanOrEqual(minimumDepartureTime.getTime());
        expect(currentTime).toBeLessThanOrEqual(maximumArrivalTime.getTime());
      }
    };

    describe("Arrival Thu Nov 29 2018 20:01:27 GMT+0100", () => {
      jest.setTimeout(100000);

      const minimumDepartureTime = new Date(1543518087748);
      minimumDepartureTime.setHours(minimumDepartureTime.getHours() - 2);

      const maximumArrivalTime = new Date(1543518087748);

      const query: IQuery = {
        publicTransportOnly: true,
        from: "http://irail.be/stations/NMBS/008896925", // Ingelmunster
        to: "http://irail.be/stations/NMBS/008892007", // Ghent-Sint-Pieters
        maximumArrivalTime,
        minimumDepartureTime,
      };
      let result: IPath[];

      beforeAll(async () => {
        const queryRunner =  createQueryRunner();
        const iterator = await queryRunner.run(query);

        result = await Iterators.toArray(iterator);
      });

      it("Correct departure and arrival stop", () => {
        checkStops(result, query);
      });

      it("Correct departure and arrival time", () => {
        checkTimes(result, minimumDepartureTime, maximumArrivalTime);
      });
    });

    describe("Departure Time now - Arrival Time now+2h", () => {
      jest.setTimeout(100000);

      const minimumDepartureTime = new Date();
      const maximumArrivalTime = new Date();
      maximumArrivalTime.setHours(maximumArrivalTime.getHours() + 2);

      const query: IQuery = {
        publicTransportOnly: true,
        from: "http://irail.be/stations/NMBS/008896925", // Ingelmunster
        to: "http://irail.be/stations/NMBS/008892007", // Ghent-Sint-Pieters
        maximumArrivalTime,
        minimumDepartureTime,
      };
      let result: IPath[];

      beforeAll(async () => {
        const queryRunner =  createQueryRunner();
        const iterator = await queryRunner.run(query);

        result = await Iterators.toArray(iterator);
      });

      it("Correct departure and arrival stop", () => {
        checkStops(result, query);
      });

      it("Correct departure and arrival time", () => {
        checkTimes(result, minimumDepartureTime, maximumArrivalTime);
      });
    });

    describe("Initial walking possibilities in Brussels", () => {
      jest.setTimeout(100000);

      const minimumDepartureTime = new Date();
      const maximumArrivalTime = new Date();
      maximumArrivalTime.setHours(maximumArrivalTime.getHours() + 3);

      const query: IQuery = {
        publicTransportOnly: true,
        from: "http://irail.be/stations/NMBS/008812005", // Brussels North
        to: "http://irail.be/stations/NMBS/008892007", // Ghent-Sint-Pieters
        maximumArrivalTime,
        minimumDepartureTime,
      };
      let result: IPath[];

      beforeAll(async () => {
        const queryRunner =  createQueryRunner();
        const iterator = await queryRunner.run(query);

        result = await Iterators.toArray(iterator);
      });

      it("Correct departure and arrival stop", () => {
        checkStops(result, query);
      });

      it("Correct departure and arrival time", () => {
        checkTimes(result, minimumDepartureTime, maximumArrivalTime);
      });
    });

  });
});
