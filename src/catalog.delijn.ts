import Catalog from "./Catalog";
import TravelMode from "./TravelMode";

const catalog = new Catalog();
catalog.addStopsFetcher(
  "https://data.delijn.be/stops/",
  "https://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/stops",
);
catalog.addConnectionsFetcher("https://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/connections", TravelMode.Bus);

export default catalog;
