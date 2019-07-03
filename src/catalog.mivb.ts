import Catalog from "./Catalog";
import TravelMode from "./enums/TravelMode";

const catalogMivb = new Catalog();

catalogMivb.addStopsSource("https://openplanner.ilabt.imec.be/mivb/stops");

export default catalogMivb;
