import haversine from "haversine";
import { injectable } from "inversify";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import IProbabilisticValue from "../../interfaces/IProbabilisticValue";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import IRoadPlanner from "./IRoadPlanner";

@injectable()
export default class RoadPlannerBirdsEye implements IRoadPlanner {

  public async plan(query: IResolvedQuery): Promise<IPath[]> {
    const { from: fromLocations, to: toLocations, minimumWalkingSpeed, maximumWalkingSpeed} = query;

    const paths = [];

    if (fromLocations && toLocations && fromLocations.length && toLocations.length) {

      for (const from of fromLocations) {
        for (const to of toLocations) {
          paths.push(this.getPathBetweenLocations(from, to, minimumWalkingSpeed, maximumWalkingSpeed));
        }
      }
    }

    return paths;
  }

  private getPathBetweenLocations(
    from: ILocation,
    to: ILocation,
    minWalkingSpeed: number,
    maxWalkingSpeed: number,
  ): IPath {

    const distance = this.getDistanceBetweenLocations(from, to);
    const minDuration = distance / maxWalkingSpeed;
    const maxDuration = distance / minWalkingSpeed;

    const duration: IProbabilisticValue = {
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
      }],
    };
  }

  private getDistanceBetweenLocations(from: ILocation, to: ILocation): number {
    const { longitude: depLongitude, latitude: depLatitude } = from;
    const { longitude: arrLongitude, latitude: arrLatitude } = to;

    if (depLongitude === undefined || depLatitude === undefined ||
      arrLongitude === undefined || arrLatitude === undefined) {
      return Number.POSITIVE_INFINITY;
    }

    return haversine({
      latitude: depLatitude,
      longitude: depLongitude,
    }, {
      latitude: arrLatitude,
      longitude: arrLongitude,
    });
  }
}
