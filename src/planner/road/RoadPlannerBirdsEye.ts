import IJourney from "../IJourney";
import { injectable } from "inversify";
import IRoadPlanner from "./IRoadPlanner";


@injectable()
export default class RoadPlannerBirdsEye implements IRoadPlanner {
  plan: () => [IJourney];

}
