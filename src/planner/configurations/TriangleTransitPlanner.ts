import triangleDemoProfile from "../../configs/triangle_transit";
import Planner from "./Planner";

export default class TriangleTransitPlanner extends Planner {
    constructor() {
        super(triangleDemoProfile);
    }
}
