import dissectProfile from "../../configs/dissect";
import Planner from "./Planner";

export default class DissectPlanner extends Planner {
    constructor() {
        super(dissectProfile);
    }
}
