import { injectable } from "inversify";
import IConnection from "../IConnection";
import ConnectionsFetcherLDFetch from "./ConnectionsFetcherLDFetch";
import ConnectionsIteratorLDFetch from "./ConnectionsIteratorLDFetch";
import TravelMode from "../../../TravelMode";

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
