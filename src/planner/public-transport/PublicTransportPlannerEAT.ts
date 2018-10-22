import IJourney from "../IJourney";
import { injectable } from "inversify";
import IPublicTransportPlanner from "./IPublicTransportPlanner";


@injectable()
export default class PublicTransportPlannerEAT implements IPublicTransportPlanner {
  plan: () => Promise<IJourney[]>;

}
