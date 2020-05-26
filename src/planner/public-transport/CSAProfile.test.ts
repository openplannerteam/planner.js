import "jest";
import LDFetch from "ldfetch";
import Defaults from "../../Defaults";
import TravelMode from "../../enums/TravelMode";
import ConnectionsFetcherRaw from "../../fetcher/connections/ConnectionsFetcherRaw";
import ConnectionsProviderDefault from "../../fetcher/connections/ConnectionsProviderDefault";
import ConnectionsProviderNMBSTest from "../../fetcher/connections/tests/ConnectionsProviderNMBSTest";
import connectionsIngelmunsterGhent from "../../fetcher/connections/tests/data/ingelmunster-ghent";
import connectionsJoining from "../../fetcher/connections/tests/data/joining";
import connectionsSplitting from "../../fetcher/connections/tests/data/splitting";
import HydraTemplateFetcherDefault from "../../fetcher/hydra/HydraTemplateFetcherDefault";
import StopsFetcherLDFetch from "../../fetcher/stops/ld-fetch/StopsFetcherLDFetch";
import ILeg from "../../interfaces/ILeg";
import IPath from "../../interfaces/IPath";
import IQuery from "../../interfaces/IQuery";
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

      const connectionProvider = new ConnectionsProviderNMBSTest(connections);
      const stopsFetcher = new StopsFetcherLDFetch(ldFetch);
      stopsFetcher.setAccessUrl("https://irail.be/stations/NMBS");

      const locationResolver = new LocationResolverDefault(stopsFetcher);
      const reachableStopsFinder = new ReachableStopsFinderBirdsEyeCached(stopsFetcher);
      const journeyExtractor = new JourneyExtractorProfile(
        locationResolver,
      );

      return new CSAProfile(
        connectionProvider,
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
        from: [{ latitude: 50.914326, longitude: 3.255415 }],
        to: [{ latitude: 51.035896, longitude: 3.710875 }],
        profileID: "https://hdelva.be/profile/pedestrian",
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
          expect(path.legs).toBeDefined();
          expect(path.legs[0]).toBeDefined();
          expect(query.from.map((from) => from.id)).toContain(path.legs[0].getStartLocation().id);
          expect(query.to.map((to) => to.id)).toContain(path.legs[path.legs.length - 1].getStopLocation().id);
        }
      });
    });
  });

  describe("real-time data", () => {
    const createQueryRunner = () => {
      const ldFetch = new LDFetch({ headers: { Accept: "application/ld+json" } });

      const connectionProvider = new ConnectionsProviderDefault(
        (travelMode: TravelMode) => {
          const fetcher = new ConnectionsFetcherRaw();
          fetcher.setTravelMode(travelMode);
          return fetcher;
        },
        new HydraTemplateFetcherDefault(ldFetch),
      );

      connectionProvider.addConnectionSource({
        accessUrl: "https://graph.irail.be/sncb/connections",
        travelMode: TravelMode.Train,
      });

      const stopsFetcher = new StopsFetcherLDFetch(ldFetch);
      stopsFetcher.setAccessUrl("https://irail.be/stations/NMBS");

      const locationResolver = new LocationResolverDefault(stopsFetcher);
      const reachableStopsFinder = new ReachableStopsFinderBirdsEyeCached(stopsFetcher);
      const journeyExtractor = new JourneyExtractorProfile(
        locationResolver,
      );

      const CSA = new CSAProfile(
        connectionProvider,
        locationResolver,
        reachableStopsFinder,
        reachableStopsFinder,
        reachableStopsFinder,
        journeyExtractor,
      );

      return new QueryRunnerDefault(locationResolver, CSA, undefined);
    };

    const checkStops = (result: IPath[], query) => {
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThanOrEqual(1);

      for (const path of result) {
        expect(path.legs).toBeDefined();

        expect(path.legs.length).toBeGreaterThanOrEqual(1);

        let currentLocation = query.from;
        path.legs.forEach((leg: ILeg) => {
          expect(leg).toBeDefined();
          expect(currentLocation).toEqual(leg.getStartLocation().id);
          currentLocation = leg.getStopLocation().id;
        });

        expect(query.to).toEqual(currentLocation);
      }
    };

    const checkTimes = (result: IPath[], minimumDepartureTime, maximumArrivalTime) => {
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThanOrEqual(1);

      for (const path of result) {
        expect(path.legs).toBeDefined();

        expect(path.legs.length).toBeGreaterThanOrEqual(1);
        expect(path.legs[0]).toBeDefined();
        expect(path.legs[path.legs.length - 1]).toBeDefined();

        let currentTime = minimumDepartureTime.getTime();
        path.legs.forEach((leg: ILeg) => {
          expect(leg).toBeDefined();
          if (leg.getTravelMode() === TravelMode.Walking) {
            currentTime += leg.getMinimumDuration();
          } else {
            expect(currentTime).toBeLessThanOrEqual(leg.getStartTime().getTime());
            currentTime = leg.getStopTime().getTime();
          }
        });

        expect(path.legs[0].getStartTime().getTime()).toBeGreaterThanOrEqual(minimumDepartureTime.getTime());
        expect(currentTime).toBeLessThanOrEqual(maximumArrivalTime.getTime());
      }
    };

    describe("Arrival Thu Nov 29 2018 20:01:27 GMT+0100", () => {
      jest.setTimeout(100000);

      const minimumDepartureTime = new Date(1543518087748);
      minimumDepartureTime.setHours(minimumDepartureTime.getHours() - 2);

      const maximumArrivalTime = new Date(1543518087748);

      const query: IQuery = {
        from: "http://irail.be/stations/NMBS/008896925", // Ingelmunster
        to: "http://irail.be/stations/NMBS/008892007", // Ghent-Sint-Pieters
        maximumArrivalTime,
        minimumDepartureTime,
      };
      let result: IPath[];

      beforeAll(async () => {
        const queryRunner = createQueryRunner();
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
      minimumDepartureTime.setHours(8);
      const maximumArrivalTime = new Date();
      maximumArrivalTime.setHours(8 + 2);

      const query: IQuery = {
        from: "http://irail.be/stations/NMBS/008896925", // Ingelmunster
        to: "http://irail.be/stations/NMBS/008892007", // Ghent-Sint-Pieters
        maximumArrivalTime,
        minimumDepartureTime,
      };
      let result: IPath[];

      beforeAll(async () => {
        const queryRunner = createQueryRunner();
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
      minimumDepartureTime.setHours(8);
      const maximumArrivalTime = new Date();
      maximumArrivalTime.setHours(8 + 3);

      const query: IQuery = {
        from: "http://irail.be/stations/NMBS/008812005", // Brussels North
        to: "http://irail.be/stations/NMBS/008892007", // Ghent-Sint-Pieters
        maximumArrivalTime,
        minimumDepartureTime,
      };
      let result: IPath[];

      beforeAll(async () => {
        const queryRunner = createQueryRunner();
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
