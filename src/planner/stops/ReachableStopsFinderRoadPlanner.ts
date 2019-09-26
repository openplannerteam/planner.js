import { AsyncIterator } from "asynciterator";
import { inject, injectable } from "inversify";
import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import IStop from "../../fetcher/stops/IStop";
import IStopsProvider from "../../fetcher/stops/IStopsProvider";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import { DurationMs, SpeedKmH } from "../../interfaces/units";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import Geo from "../../util/Geo";
import Iterators from "../../util/Iterators";
import Units from "../../util/Units";
import IRoadPlanner from "../road/IRoadPlanner";
import IReachableStopsFinder, { IReachableStop } from "./IReachableStopsFinder";

/**
 * This [[IReachableStopsFinder]] uses the registered [[IRoadPlanner]] to find reachable stops.
 * It makes an initial selection of stops based on bird's-eye distance, after which a road planner query gets executed
 * for each of these stops.
 */
@injectable()
export default class ReachableStopsFinderRoadPlanner implements IReachableStopsFinder {
  private readonly stopsProvider: IStopsProvider;
  private readonly roadPlanner: IRoadPlanner;

  constructor(
    @inject(TYPES.StopsProvider) stopsProvider: IStopsProvider,
    @inject(TYPES.RoadPlanner) roadPlanner: IRoadPlanner,
  ) {
    this.stopsProvider = stopsProvider;
    this.roadPlanner = roadPlanner;
  }

  public async findReachableStops(
    location: ILocation,
    mode: ReachableStopsFinderMode,
    maximumDuration: DurationMs,
    minimumSpeed: SpeedKmH,
    profileID: string,
  ): Promise<IReachableStop[]> {

    const minimumDepartureTime = new Date();
    const maximumArrivalTime = new Date(minimumDepartureTime.getTime() + maximumDuration);

    const baseProp = mode === ReachableStopsFinderMode.Target ? "to" : "from";
    const otherProp = mode === ReachableStopsFinderMode.Target ? "from" : "to";

    const baseQuery: IResolvedQuery = {
      [baseProp]: [location],
      minimumDepartureTime,
      maximumArrivalTime,
      minimumWalkingSpeed: minimumSpeed,
      profileID,
    };

    const allStops: IStop[] = await this.stopsProvider.getAllStops();

    const stopsInsideCircleArea: IStop[] = [];
    for (const stop of allStops) {
      const distance = Geo.getDistanceBetweenLocations(location, stop);
      const duration = Units.toDuration(distance, minimumSpeed);

      if (duration >= 0 && duration <= maximumDuration) {
        stopsInsideCircleArea.push(stop);
      }
    }

    const reachableStops: IReachableStop[] = [];

    await Promise.all(stopsInsideCircleArea.map(async (possibleTarget: IStop) => {
      const query = Object.assign({}, baseQuery, {
        [otherProp]: [possibleTarget as ILocation],
      });

      const pathIterator = await this.roadPlanner.plan(query);

      const durationIterator: AsyncIterator<DurationMs> = pathIterator.map((path: IPath) =>
        // Minimum speed is passed so sum max duration over all steps
        path.legs.reduce((totalDuration: DurationMs, leg) => totalDuration + leg.getMaximumDuration(), 0),
      );

      const durations = await Iterators.toArray(durationIterator);
      if (durations.length) {
        const shortestDuration = Math.min(...durations);
        if (shortestDuration < maximumDuration) {
          reachableStops.push({ stop: possibleTarget, duration: shortestDuration });
        }
      }
    }));

    return reachableStops;
  }
}
