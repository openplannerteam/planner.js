import { AsyncIterator } from "asynciterator";
import { inject, injectable } from "inversify";
import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import IStop from "../../fetcher/stops/IStop";
import IStopsProvider from "../../fetcher/stops/IStopsProvider";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import { DurationMs, SpeedkmH } from "../../interfaces/units";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import Iterators from "../../util/Iterators";
import IRoadPlanner from "../road/IRoadPlanner";
import IReachableStopsFinder, { IReachableStop } from "./IReachableStopsFinder";

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
    sourceOrTargetStop: IStop,
    mode: ReachableStopsFinderMode,
    maximumDuration: DurationMs,
    minimumSpeed: SpeedkmH,
  ): Promise<IReachableStop[]> {

    const minimumDepartureTime = new Date();
    const maximumArrivalTime = new Date(minimumDepartureTime.getTime() + maximumDuration);

    const baseProp = mode === ReachableStopsFinderMode.Target ? "to" : "from";
    const otherProp = mode === ReachableStopsFinderMode.Target ? "from" : "to";

    const baseQuery: IResolvedQuery = {
      [baseProp]: [sourceOrTargetStop as ILocation],
      minimumDepartureTime,
      maximumArrivalTime,
      minimumWalkingSpeed: minimumSpeed,
    };

    const allStops = await this.stopsProvider.getAllStops();
    const reachableStops: IReachableStop[] = [{stop: sourceOrTargetStop, duration: 0}];

    await Promise.all(allStops.map(async (possibleTarget: IStop) => {
      if (possibleTarget.id !== sourceOrTargetStop.id) {

        const query = Object.assign({}, baseQuery, {
          [otherProp]: [possibleTarget as ILocation],
        });

        const pathIterator = await this.roadPlanner.plan(query);

        const durationIterator: AsyncIterator<DurationMs> = pathIterator.map((path: IPath) =>
          // Minimum speed is passed so sum max duration over all steps
          path.steps.reduce((totalDuration: DurationMs, step) => totalDuration + step.duration.maximum, 0),
        );

        const sufficientlyShortDuration = await Iterators
          .find(durationIterator, (duration: DurationMs) => duration < maximumDuration);

        if (sufficientlyShortDuration) {
          reachableStops.push({stop: possibleTarget, duration: sufficientlyShortDuration});
        }
      }

    }));

    return reachableStops;
  }
}
