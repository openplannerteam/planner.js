import basicTrainProfile from "../../configs/basic_train";
import Planner from "./Planner";

export default class BasicTrainPlanner extends Planner {
    constructor() {
        super(basicTrainProfile);
    }
}
