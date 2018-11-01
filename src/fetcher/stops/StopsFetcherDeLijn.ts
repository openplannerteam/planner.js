import { injectable } from "inversify";
import IStopsFetcher from "./IStopsFetcher";
import StopsFetcherLDFetch from "./StopsFetcherLDFetch";

const STOPS_URLS = [
  "https://belgium.linkedconnections.org/delijn/Antwerpen/stops",
  "https://belgium.linkedconnections.org/delijn/Oost-Vlaanderen/stops",
  "https://belgium.linkedconnections.org/delijn/West-Vlaanderen/stops",
  "https://belgium.linkedconnections.org/delijn/Vlaams-Brabant/stops",
  "https://belgium.linkedconnections.org/delijn/Limburg/stops",
];

@injectable()
export default class StopsFetcherDeLijn extends StopsFetcherLDFetch implements IStopsFetcher {

  constructor() {
    super("https://data.delijn.be/stops/", STOPS_URLS);
  }

}
