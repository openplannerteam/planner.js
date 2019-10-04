import { ArrayIterator, AsyncIterator } from "asynciterator";
import { injectable } from "inversify";
import TravelMode from "../../enums/TravelMode";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import IProbabilisticValue from "../../interfaces/IProbabilisticValue";
import { DurationMs, SpeedKmH } from "../../interfaces/units";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import Geo from "../../util/Geo";
import Units from "../../util/Units";
import Leg from "../Leg";
import Path from "../Path";
import IRoadPlanner from "./IRoadPlanner";

@injectable()
export default class RoadPlannerBirdsEye implements IRoadPlanner {

  public async plan(query: IResolvedQuery): Promise<AsyncIterator<IPath>> {
    const {
      from: fromLocations,
      to: toLocations,
      minimumWalkingSpeed,
      maximumWalkingSpeed,
      maximumWalkingDuration,
    } = query;

    const paths = [];

    if (fromLocations && toLocations && fromLocations.length && toLocations.length) {

      for (const from of fromLocations) {
        for (const to of toLocations) {

          const path = this.getPathBetweenLocations(
            from,
            to,
            minimumWalkingSpeed,
            maximumWalkingSpeed,
            maximumWalkingDuration,
          );

          if (path) {
            paths.push(path);
          }
        }
      }
    }

    return new ArrayIterator<IPath>(paths);
  }

  private getPathBetweenLocations(
    from: ILocation,
    to: ILocation,
    minWalkingSpeed: SpeedKmH,
    maxWalkingSpeed: SpeedKmH,
    maxWalkingDuration: DurationMs,
  ): IPath {

    const distance = Geo.getDistanceBetweenLocations(from, to);
    const minDuration = Units.toDuration(distance, maxWalkingSpeed);
    const maxDuration = Units.toDuration(distance, minWalkingSpeed);

    const duration: IProbabilisticValue<DurationMs> = {
      minimum: minDuration,
      maximum: maxDuration,
      average: (minDuration + maxDuration) / 2,
    };

    if (duration.maximum > maxWalkingDuration) {
      return;
    }

    return new Path([
      new Leg(TravelMode.Walking, [{
        startLocation: from,
        stopLocation: to,
        duration,
        distance,
      }]),
    ]);
  }
}
