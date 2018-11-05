import { inject, injectable } from "inversify";
import IStop from "../../fetcher/stops/IStop";
import IStopsFetcherMediator from "../../fetcher/stops/IStopsFetcherMediator";
import TYPES from "../../types";
import Geo from "../../util/Geo";
import IReachableStopsFinder, { IReachableStop } from "./IReachableStopsFinder";

@injectable()
export default class ReachableStopsFinderBirdsEye implements IReachableStopsFinder {
  private readonly stopsFetcherMediator: IStopsFetcherMediator;

  constructor(
    @inject(TYPES.StopsFetcherMediator) stopsFetcherMediator: IStopsFetcherMediator,
  ) {
    this.stopsFetcherMediator = stopsFetcherMediator;
  }

  public async findReachableStops(
    source: IStop,
    maximumDuration: number,
    minimumSpeed: number): Promise<IReachableStop[]> {

    const allStops = await this.stopsFetcherMediator.getAllStops();

    return allStops.map((possibleTarget: IStop): IReachableStop => {
      if (possibleTarget.id === source.id) {
        return [source, 0];
      }

      const distance = Geo.getDistanceBetweenStops(source, possibleTarget);
      const duration = distance / minimumSpeed;

      if (duration <= maximumDuration) {
        return [possibleTarget, duration];
      }
    }).filter((reachableStop) => !!reachableStop);
  }
}
