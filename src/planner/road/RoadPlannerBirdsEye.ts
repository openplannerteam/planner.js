import IJourney from "../IJourney";
import { inject, injectable } from "inversify";
import IRoadPlanner from "./IRoadPlanner";
import TYPES from "../../types";
import IStopsFetcher from "../../fetcher/stops/IStopsFetcher";


@injectable()
export default class RoadPlannerBirdsEye implements IRoadPlanner {
  private stopsFetcher: IStopsFetcher;

  constructor(
    @inject(TYPES.StopsFetcher) stopsFetcher: IStopsFetcher
  ) {
    this.stopsFetcher = stopsFetcher;
  }

  async plan(): Promise<IJourney[]> {
    return [{distance: 50}];
  }
}
