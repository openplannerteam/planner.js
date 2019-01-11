import Catalog from "./Catalog";
import TravelMode from "./enums/TravelMode";

const catalog = new Catalog();

catalog.addStopsFetcher("http://openplanner.ilabt.imec.be/delijn/Antwerpen/stops");
catalog.addStopsFetcher("http://openplanner.ilabt.imec.be/delijn/Limburg/stops");
catalog.addStopsFetcher("http://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/stops");
catalog.addStopsFetcher("http://openplanner.ilabt.imec.be/delijn/Vlaams-Brabant/stops");
catalog.addStopsFetcher("http://openplanner.ilabt.imec.be/delijn/West-Vlaanderen/stops");

catalog.addConnectionsFetcher("http://openplanner.ilabt.imec.be/delijn/Antwerpen/connections", TravelMode.Bus);
catalog.addConnectionsFetcher("http://openplanner.ilabt.imec.be/delijn/Limburg/connections", TravelMode.Bus);
catalog.addConnectionsFetcher("http://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/connections", TravelMode.Bus);
catalog.addConnectionsFetcher("http://openplanner.ilabt.imec.be/delijn/Vlaams-Brabant/connections", TravelMode.Bus);
catalog.addConnectionsFetcher("http://openplanner.ilabt.imec.be/delijn/West-Vlaanderen/connections", TravelMode.Bus);

export default catalog;
