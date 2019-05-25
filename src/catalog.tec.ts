import Catalog from "./Catalog";
import TravelMode from "./enums/TravelMode";

const catalogTec = new Catalog();

catalogTec.addStopsSource("https://openplanner.ilabt.imec.be/tec/stops");

export default catalogTec;
