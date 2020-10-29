import { QueryMode } from ".";
import IDataSource from "./data/IDataSource";
import Planner from "./planner/configurations/Planner";
export default function createPlanner(sources: IDataSource[], queryMode: QueryMode): Planner;
