import { AsyncIterator } from "asynciterator";
import IPath from "../../interfaces/IPath";
import IQuery from "../../interfaces/IQuery";
import Planner from "./Planner";
export default class TransitCarPlanner extends Planner {
    constructor();
    query(query: IQuery): AsyncIterator<IPath>;
    completePath(path: IPath): Promise<IPath>;
}
