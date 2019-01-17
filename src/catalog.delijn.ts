import Catalog from "./Catalog";
import TravelMode from "./enums/TravelMode";

const catalog = new Catalog();

catalog.addStopsSource("http://openplanner.ilabt.imec.be/delijn/Antwerpen/stops");
catalog.addStopsSource("http://openplanner.ilabt.imec.be/delijn/Limburg/stops");
catalog.addStopsSource("http://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/stops");
catalog.addStopsSource("http://openplanner.ilabt.imec.be/delijn/Vlaams-Brabant/stops");
catalog.addStopsSource("http://openplanner.ilabt.imec.be/delijn/West-Vlaanderen/stops");

catalog.addConnectionsSource("http://openplanner.ilabt.imec.be/delijn/Antwerpen/connections", TravelMode.Bus);
catalog.addConnectionsSource("http://openplanner.ilabt.imec.be/delijn/Limburg/connections", TravelMode.Bus);
catalog.addConnectionsSource("http://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/connections", TravelMode.Bus);
catalog.addConnectionsSource("http://openplanner.ilabt.imec.be/delijn/Vlaams-Brabant/connections", TravelMode.Bus);
catalog.addConnectionsSource("http://openplanner.ilabt.imec.be/delijn/West-Vlaanderen/connections", TravelMode.Bus);

export default catalog;
