import Context from "./Context";
import defaultContainer from "./inversify.config";
import IQuery from "./interfaces/IQuery";
import IQueryResult from "./interfaces/IQueryResult";
import IQueryRunner from "./query-runner/IQueryRunner";
import TYPES from "./types";

export default class Planner {
  private context: Context;
  private queryRunner: IQueryRunner;

  constructor(container = defaultContainer) {
    this.context = container.get<Context>(TYPES.Context);
    this.queryRunner = container.get<IQueryRunner>(TYPES.QueryRunner);

    this.context.setContainer(container);
  }

  public async query(query: IQuery): Promise<IQueryResult> {
    return this.queryRunner.run(query);
  }
}
