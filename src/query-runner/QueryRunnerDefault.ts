import { inject, injectable } from "inversify";
import IJourney from "../planner/IJourney";
import IPublicTransportPlanner from "../planner/public-transport/IPublicTransportPlanner";
import IRoadPlanner from "../planner/road/IRoadPlanner";
import TYPES from "../types";
import IQuery from "./IQuery";
import IQueryResult from "./IQueryResult";
import IQueryRunner from "./IQueryRunner";

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

  public async run(query: IQuery): Promise<IQueryResult> {
    const result: IJourney[] = await this.roadPlanner.plan(query);
    const firstJourney = result[0];

    return Promise.resolve({result: firstJourney.distance});
  }
}
