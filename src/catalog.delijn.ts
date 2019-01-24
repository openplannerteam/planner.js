import Catalog from "./Catalog";
import TravelMode from "./enums/TravelMode";

/* tslint:disable:max-line-length */

const catalogDeLijn = new Catalog();

catalogDeLijn.addStopsSource("http://openplanner.ilabt.imec.be/delijn/Antwerpen/stops");
catalogDeLijn.addStopsSource("http://openplanner.ilabt.imec.be/delijn/Limburg/stops");
catalogDeLijn.addStopsSource("http://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/stops");
catalogDeLijn.addStopsSource("http://openplanner.ilabt.imec.be/delijn/Vlaams-Brabant/stops");
catalogDeLijn.addStopsSource("http://openplanner.ilabt.imec.be/delijn/West-Vlaanderen/stops");

catalogDeLijn.addConnectionsSource("http://openplanner.ilabt.imec.be/delijn/Antwerpen/connections", TravelMode.Bus);
catalogDeLijn.addConnectionsSource("http://openplanner.ilabt.imec.be/delijn/Limburg/connections", TravelMode.Bus);
catalogDeLijn.addConnectionsSource("http://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/connections", TravelMode.Bus);
catalogDeLijn.addConnectionsSource("http://openplanner.ilabt.imec.be/delijn/Vlaams-Brabant/connections", TravelMode.Bus);
catalogDeLijn.addConnectionsSource("http://openplanner.ilabt.imec.be/delijn/West-Vlaanderen/connections", TravelMode.Bus);

export default catalogDeLijn;
