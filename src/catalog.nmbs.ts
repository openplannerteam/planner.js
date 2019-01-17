import Catalog from "./Catalog";
import TravelMode from "./enums/TravelMode";

const catalog = new Catalog();
catalog.addStopsSource("https://irail.be/stations/NMBS");
catalog.addConnectionsSource("https://graph.irail.be/sncb/connections", TravelMode.Train);

export default catalog;
