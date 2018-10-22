import IQuery from "../query-runner/IQuery";
import IJourney from "./IJourney";

export default interface IPlanner {
  plan: (query: IQuery) => Promise<IJourney[]>;
}
