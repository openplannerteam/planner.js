import Catalog from "./Catalog";
import TravelMode from "./TravelMode";

const catalog = new Catalog();
catalog.addStopsFetcher("https://irail.be/stations/NMBS");
catalog.addConnectionsFetcher("https://graph.irail.be/sncb/connections", TravelMode.Train);

export default catalog;
