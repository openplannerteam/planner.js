import IQueryRunner from "./IQueryRunner";
import { inject, injectable } from "inversify";
import TYPES from "../types";
import IPublicTransportPlanner from "../planner/public-transport/IPublicTransportPlanner";
import IQuery from "./IQuery";
import IQueryResult from "./IQueryResult";

@injectable()
export default class QueryRunnerDefault implements IQueryRunner {
  private publicTransportPlanner: IPublicTransportPlanner;

  constructor(
    @inject(TYPES.PublicTransportPlanner) publicTransportPlanner: IPublicTransportPlanner,
  ) {
    this.publicTransportPlanner = publicTransportPlanner;
  }

  run(query: IQuery): IQueryResult {
    return {result: Math.random()}
  }
}
