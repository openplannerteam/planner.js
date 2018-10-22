import IQueryRunner from "./IQueryRunner";
import { inject, injectable } from "inversify";
import TYPES from "../types";
import IPublicTransportPlanner from "../planner/public-transport/IPublicTransportPlanner";
import IQuery from "./IQuery";
import IQueryResult from "./IQueryResult";
import IRoadPlanner from "../planner/road/IRoadPlanner";
import IJourney from "../planner/IJourney";

@injectable()
export default class QueryRunnerDefault implements IQueryRunner {
  private publicTransportPlanner: IPublicTransportPlanner;
  private roadPlanner: IRoadPlanner;

  constructor(
    @inject(TYPES.PublicTransportPlanner) publicTransportPlanner: IPublicTransportPlanner,
    @inject(TYPES.RoadPlanner) roadPlanner: IRoadPlanner,
  ) {
    this.publicTransportPlanner = publicTransportPlanner;
    this.roadPlanner = roadPlanner;
  }

  async run(query: IQuery): Promise<IQueryResult> {
    const result: IJourney[] = await this.roadPlanner.plan();
    const firstJourney = result[0];

    return Promise.resolve({result: firstJourney.distance});
  }
}
