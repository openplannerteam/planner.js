import { injectable } from "inversify";
import IStopsFetcher from "../IStopsFetcher";
import StopsFetcherLDFetch from "./StopsFetcherLDFetch";

const STOPS_URLS = [
  "http://openplanner.ilabt.imec.be/delijn/Antwerpen/stops",
  "http://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/stops",
  "http://openplanner.ilabt.imec.be/delijn/West-Vlaanderen/stops",
  "http://openplanner.ilabt.imec.be/delijn/Vlaams-Brabant/stops",
  "http://openplanner.ilabt.imec.be/delijn/Limburg/stops",
];

@injectable()
export default class StopsFetcherDeLijn extends StopsFetcherLDFetch implements IStopsFetcher {

  constructor() {
    super("https://data.delijn.be/stops/", STOPS_URLS);
  }

}
