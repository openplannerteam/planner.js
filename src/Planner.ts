import Context from "./Context";
import IQuery from "./interfaces/IQuery";
import IQueryResult from "./interfaces/IQueryResult";
import defaultContainer from "./inversify.config";
import IQueryRunner from "./query-runner/IQueryRunner";
import TYPES from "./types";

export default class Planner {
  private context: Context;
  private queryRunner: IQueryRunner;

  constructor(container = defaultContainer) {
    // Store container on context before doing anything else
    this.context = container.get<Context>(TYPES.Context);
    this.context.setContainer(container);

    this.queryRunner = container.get<IQueryRunner>(TYPES.QueryRunner);
  }

  public async query(query: IQuery): Promise<IQueryResult> {
    return this.queryRunner.run(query);
  }
}
