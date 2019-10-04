import Catalog from "./Catalog";
import TravelMode from "./enums/TravelMode";

const catalogMivb = new Catalog();

catalogMivb.addStopsSource("https://openplanner.ilabt.imec.be/mivb/stops");
catalogMivb.addConnectionsSource("https://openplanner.ilabt.imec.be/mivb/connections", TravelMode.Bus);

export default catalogMivb;
