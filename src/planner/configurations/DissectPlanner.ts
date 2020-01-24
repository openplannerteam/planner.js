import dissectProfile from "../../configs/dissect";
import TravelMode from "../../enums/TravelMode";
import Planner from "./Planner";

export default class DissectPlanner extends Planner {
    constructor() {
        super(dissectProfile);

        this.addConnectionSource(
            "https://graph.irail.be/sncb/connections",
            TravelMode.Train,
        );
        this.addConnectionSource(
            "https://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/connections",
            TravelMode.Bus,
        );
        this.addConnectionSource(
            "https://openplanner.ilabt.imec.be/mivb/connections",
            TravelMode.Bus,
        );

        this.addStopSource("https://irail.be/stations/NMBS");
        this.addStopSource("https://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/stops");
        this.addStopSource("https://openplanner.ilabt.imec.be/mivb/stops");
    }
}
