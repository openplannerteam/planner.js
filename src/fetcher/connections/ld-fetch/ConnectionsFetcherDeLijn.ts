import { injectable } from "inversify";
import TravelMode from "../../../TravelMode";
import IConnection from "../IConnection";
import ConnectionsFetcherLDFetch from "./ConnectionsFetcherLDFetch";
import ConnectionsIteratorLDFetch from "./ConnectionsIteratorLDFetch";

const DE_LIJN_BASE_URL = "http://openplanner.ilabt.imec.be/delijn/West-Vlaanderen/connections";

@injectable()
export default class ConnectionsFetcherDeLijn extends ConnectionsFetcherLDFetch {

  public fetch(): AsyncIterator<IConnection> {
    return new ConnectionsIteratorLDFetch(
      DE_LIJN_BASE_URL,
      TravelMode.Bus,
      this.ldFetch,
      this.config,
    );
  }
}
