import { AsyncIterator } from "asynciterator";
import zoiDemoPlanner from "../../configs/zoi_demo_planner";
import IPath from "../../interfaces/IPath";
import IQuery from "../../interfaces/IQuery";
import Planner from "./Planner";

export default class ZoiDemoPlanner extends Planner {
    constructor() {
        super(zoiDemoPlanner);
    }

    public query(query: IQuery): AsyncIterator<IPath> {
        query.roadNetworkOnly = true;
        return super.query(query);
    }

    public async completePath(path: IPath): Promise<IPath> {
        return path;
    }
}
