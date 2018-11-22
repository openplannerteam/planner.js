import Context from "./Context";
import IPath from "./interfaces/IPath";
import IQuery from "./interfaces/IQuery";
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
   * @param query An [[IQuery]] specifying a route planning query
   * @returns An AsyncIterableIterator of [[IPath]]s
   */
  public async* query(query: IQuery): AsyncIterableIterator<IPath> {
    yield* this.queryRunner.run(query);
  }
}
