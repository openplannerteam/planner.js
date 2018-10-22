import { inject, injectable } from "inversify";
import IStopsFetcher from "../../fetcher/stops/IStopsFetcher";
import IQuery from "../../query-runner/IQuery";
import TYPES from "../../types";
import IJourney from "../IJourney";
import IRoadPlanner from "./IRoadPlanner";

@injectable()
export default class RoadPlannerBirdsEye implements IRoadPlanner {
  private stopsFetcher: IStopsFetcher;

  constructor(@inject(TYPES.StopsFetcher) stopsFetcher: IStopsFetcher) {
    this.stopsFetcher = stopsFetcher;
  }

  public async plan(query: IQuery): Promise<IJourney[]> {
    return [{ distance: 50 }];
  }
}
