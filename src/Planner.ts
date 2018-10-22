import TYPES from "./types";
import Context from "./Context";
import IQueryRunner from "./query-runner/IQueryRunner";
import IQuery from "./query-runner/IQuery";
import defaultContainer from "./inversify.config";
import IQueryResult from "./query-runner/IQueryResult";


export default class Planner {
  private context: Context;
  private queryRunner: IQueryRunner;

  constructor(container = defaultContainer) {
    this.context = container.get<Context>(TYPES.Context);
    this.queryRunner = container.get<IQueryRunner>(TYPES.QueryRunner);

    this.context.setContainer(container);
  }

  query(query: IQuery): IQueryResult {
    return this.queryRunner.run(query);
  }
}
