import Catalog from "./Catalog";
import TravelMode from "./enums/TravelMode";

/* tslint:disable:max-line-length */

const catalogDeLijn = new Catalog();

catalogDeLijn.addStopsSource("https://openplanner.ilabt.imec.be/delijn/Antwerpen/stops");
catalogDeLijn.addStopsSource("https://openplanner.ilabt.imec.be/delijn/Limburg/stops");
catalogDeLijn.addStopsSource("https://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/stops");
catalogDeLijn.addStopsSource("https://openplanner.ilabt.imec.be/delijn/Vlaams-Brabant/stops");
catalogDeLijn.addStopsSource("https://openplanner.ilabt.imec.be/delijn/West-Vlaanderen/stops");

catalogDeLijn.addConnectionsSource("https://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/connections", TravelMode.Bus);
catalogDeLijn.addConnectionsSource("https://openplanner.ilabt.imec.be/delijn/West-Vlaanderen/connections", TravelMode.Bus);

export default catalogDeLijn;
