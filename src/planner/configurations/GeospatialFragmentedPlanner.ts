import config from "../../configs/geospatial_fragment";
import TravelMode from "../../enums/TravelMode";
import IHypermediaTreeProvider from "../../fetcher/tree/IHeadermediaTreeProvider";
import TYPES from "../../types";
import Planner from "./Planner";

export default class GeospatialFragmentedPlanner extends Planner {
    private treeProvider: IHypermediaTreeProvider;

    constructor() {
        super(config);
        this.treeProvider = config.get<IHypermediaTreeProvider>(TYPES.HypermediaTreeProvider);
    }

    public addConnectionSource(accessUrl: string, travelMode = TravelMode.Train) {
        super.addConnectionSource(accessUrl, travelMode);
        this.treeProvider.addTreeSource(accessUrl);
    }
}
