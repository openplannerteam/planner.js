import { AsyncIterator } from "asynciterator";
import transitCarProfile from "../../configs/reduced_car";
import IPath from "../../interfaces/IPath";
import IQuery from "../../interfaces/IQuery";
import Planner from "./Planner";

export default class TransitCarPlanner extends Planner {
    constructor() {
        super(transitCarProfile);
        this.setProfileID("http://hdelva.be/profile/car");
    }

    public query(query: IQuery): AsyncIterator<IPath> {
        query.roadNetworkOnly = true;
        return super.query(query);
    }

    public async completePath(path: IPath): Promise<IPath> {
        return path;
    }
}
