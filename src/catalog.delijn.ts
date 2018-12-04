import Catalog from "./Catalog";
import TravelMode from "./TravelMode";

const catalog = new Catalog();
catalog.addStopsFetcher("https://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/stops");
catalog.addStopsFetcher("https://openplanner.ilabt.imec.be/delijn/West-Vlaanderen/stops");
catalog.addStopsFetcher("https://openplanner.ilabt.imec.be/delijn/West-Vlaanderen/stops");

catalog.addConnectionsFetcher("https://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/connections", TravelMode.Bus);
catalog.addConnectionsFetcher("https://openplanner.ilabt.imec.be/delijn/West-Vlaanderen/connections", TravelMode.Bus);

export default catalog;
