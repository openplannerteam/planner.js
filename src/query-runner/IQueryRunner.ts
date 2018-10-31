import IQuery from "../interfaces/IQuery";
import IQueryResult from "../interfaces/IQueryResult";

export default interface IQueryRunner {

  run(query: IQuery): Promise<IQueryResult>;
}
