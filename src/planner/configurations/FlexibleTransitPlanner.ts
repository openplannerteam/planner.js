import flexibleTransit from "../../configs/flexible_transit";
import Planner from "./Planner";

export default class FlexibleTransitPlanner extends Planner {
    constructor() {
        super(flexibleTransit);
    }
}
