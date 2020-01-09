import config from "../../configs/flexible_profile_transit";
import Planner from "./Planner";

export default class FlexibleProfileTransitPlanner extends Planner {
    constructor() {
        super(config);
    }
}
