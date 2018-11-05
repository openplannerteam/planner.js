import { injectable } from "inversify";
import StopsFetcherLDFetch from "./StopsFetcherLDFetch";

const IRAIL_STATIONS_URL = "https://irail.be/stations/NMBS";

@injectable()
export default class StopsFetcherNMBS extends StopsFetcherLDFetch {

  constructor() {
    super("http://irail.be/stations/NMBS/", [IRAIL_STATIONS_URL]);
  }

}
