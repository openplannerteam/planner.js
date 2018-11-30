import { ArrayIterator, AsyncIterator } from "asynciterator";
import { injectable } from "inversify";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import IProbabilisticValue from "../../interfaces/IProbabilisticValue";
import { DurationMs, SpeedkmH } from "../../interfaces/units";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TravelMode from "../../TravelMode";
import Geo from "../../util/Geo";
import Units from "../../util/Units";
import IRoadPlanner from "./IRoadPlanner";

@injectable()
export default class RoadPlannerBirdsEye implements IRoadPlanner {

  public async plan(query: IResolvedQuery): Promise<AsyncIterator<IPath>> {
    const { from: fromLocations, to: toLocations, minimumWalkingSpeed, maximumWalkingSpeed} = query;

    const paths = [];

    if (fromLocations && toLocations && fromLocations.length && toLocations.length) {

      for (const from of fromLocations) {
        for (const to of toLocations) {
          paths.push(this.getPathBetweenLocations(from, to, minimumWalkingSpeed, maximumWalkingSpeed));
        }
      }
    }

    return new ArrayIterator<IPath>(paths);
  }

  private getPathBetweenLocations(
    from: ILocation,
    to: ILocation,
    minWalkingSpeed: SpeedkmH,
    maxWalkingSpeed: SpeedkmH,
  ): IPath {

    const distance = Geo.getDistanceBetweenLocations(from, to);
    const minDuration = Units.toDuration(distance, maxWalkingSpeed);
    const maxDuration = Units.toDuration(distance, minWalkingSpeed);

    const duration: IProbabilisticValue<DurationMs> = {
      minimum: minDuration,
      maximum: maxDuration,
      average: (minDuration + maxDuration) / 2,
    };

    return {
      steps: [{
        startLocation: from,
        stopLocation: to,
        duration,
        distance,
        travelMode: TravelMode.Walking,
      }],
    };
  }
}
