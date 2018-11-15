import { injectable } from "inversify";
import TravelMode from "../../../TravelMode";
import IConnection from "../IConnection";
import ConnectionsFetcherLDFetch from "./ConnectionsFetcherLDFetch";
import ConnectionsIteratorLDFetch from "./ConnectionsIteratorLDFetch";

const IRAIL_CONNECTIONS_BASE_URL = "https://graph.irail.be/sncb/connections";

@injectable()
export default class ConnectionsFetcherNMBS extends ConnectionsFetcherLDFetch {

  public fetch(): AsyncIterator<IConnection> {
    return new ConnectionsIteratorLDFetch(
      IRAIL_CONNECTIONS_BASE_URL,
      TravelMode.Train,
      this.ldFetch,
      this.config,
    );
  }
}
