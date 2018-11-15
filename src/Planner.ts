import Context from "./Context";
import IQuery from "./interfaces/IQuery";
import IQueryResult from "./interfaces/IQueryResult";
import defaultContainer from "./inversify.config";
import IQueryRunner from "./query-runner/IQueryRunner";
import TYPES from "./types";

if (!Symbol.asyncIterator) {
  (Symbol as any).asyncIterator = Symbol.for("Symbol.asyncIterator");
}

/**
 * Allows to ask route planning queries over our knowledge graphs
 */
export default class Planner {
  private context: Context;
  private queryRunner: IQueryRunner;

  /**
   * Initializes a new Planner
   * @param container The container of dependencies we are working with
   */
  constructor(container = defaultContainer) {
    // Store container on context before doing anything else
    this.context = container.get<Context>(TYPES.Context);
    this.context.setContainer(container);

    this.queryRunner = container.get<IQueryRunner>(TYPES.QueryRunner);
  }

  /**
   * Given an [[IQuery]], it will evaluate the query and eventually produce an [[IQueryResult]]
   * @todo Should return an AsyncIterator
   * @param query 
   * @returns A promise of an [[IQueryResult]]
   */
  public async query(query: IQuery): Promise<IQueryResult> {
    return this.queryRunner.run(query);
  }
}
