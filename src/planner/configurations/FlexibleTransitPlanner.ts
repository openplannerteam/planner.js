import flexibleTransit from "../../configs/flexible_transit";
import Planner from "./Planner";

export default class DissectPlanner extends Planner {
    constructor() {
        super(flexibleTransit);
    }
}
