import IQuery from "./IQuery";
import IQueryResult from "./IQueryResult";

export default interface IQueryRunner {

  run(query: IQuery): Promise<IQueryResult>;
}
