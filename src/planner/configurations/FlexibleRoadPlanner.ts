import { AsyncIterator } from "asynciterator";
import roadProfile from "../../configs/road_planner";
import IPath from "../../interfaces/IPath";
import IQuery from "../../interfaces/IQuery";
import Planner from "./Planner";

export default class FlexibleRoadPlanner extends Planner {
    constructor() {
        super(roadProfile);
    }

    public query(query: IQuery): AsyncIterator<IPath> {
        query.roadNetworkOnly = true;
        return super.query(query);
    }

    public async completePath(path: IPath): Promise<IPath> {
        return path;
    }
}
