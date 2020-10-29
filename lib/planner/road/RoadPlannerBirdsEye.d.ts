import { AsyncIterator } from "asynciterator";
import IPath from "../../interfaces/IPath";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import IRoadPlanner from "./IRoadPlanner";
export default class RoadPlannerBirdsEye implements IRoadPlanner {
    plan(query: IResolvedQuery): Promise<AsyncIterator<IPath>>;
    private getPathBetweenLocations;
}
