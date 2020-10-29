import TravelMode from "../../enums/TravelMode";
import Planner from "./Planner";
export default class GeospatialFragmentedPlanner extends Planner {
    private treeProvider;
    constructor();
    addConnectionSource(accessUrl: string, travelMode?: TravelMode): void;
}
