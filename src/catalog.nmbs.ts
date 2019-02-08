import Catalog from "./Catalog";
import TravelMode from "./enums/TravelMode";

const catalogNmbs = new Catalog();

catalogNmbs.addStopsSource("https://irail.be/stations/NMBS");
catalogNmbs.addConnectionsSource("https://graph.irail.be/sncb/connections", TravelMode.Train);

export default catalogNmbs;
