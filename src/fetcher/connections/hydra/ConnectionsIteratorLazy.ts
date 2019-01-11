import { ArrayIterator } from "asynciterator";
import LdFetch from "ldfetch";
import TravelMode from "../../../TravelMode";
import FlatMapIterator from "../../../util/iterators/FlatMapIterator";
import IConnection from "../IConnection";
import IConnectionsFetcherConfig from "../IConnectionsFetcherConfig";
import ConnectionsPageParser from "../ld-fetch/ConnectionsPageParser";
import HydraPageIterator from "./HydraPageIterator";
import IHydraPage from "./IHydraPage";
import IHydraPageIteratorConfig from "./IHydraPageIteratorConfig";

/**
 * Base class for fetching linked connections with LDFetch and letting the caller iterate over them asynchronously
 * through implementing the AsyncIterator protocol.
 * LDFetch returns documents as an array of RDF triples.
 * The meta Hydra triples are used for paginating to the next or previous page.
 * The triples that describe linked connections get deserialized to instances of [[IConnection]]
 */
export default class ConnectionsIteratorLazy extends FlatMapIterator<IHydraPage, IConnection> {
  constructor(
    baseUrl: string,
    travelMode: TravelMode,
    ldFetch: LdFetch,
    config: IConnectionsFetcherConfig,
  ) {
    const departureTimeDate = config.backward ?
      config.upperBoundDate : config.lowerBoundDate;

    const pageIteratorConfig: IHydraPageIteratorConfig = {
      backward: config.backward,
      initialTemplateVariables: {
        departureTime: departureTimeDate.toISOString(),
      },
    };

    const pageIterator = new HydraPageIterator(baseUrl, ldFetch, pageIteratorConfig);
    const parsePageConnections = (page: IHydraPage) => {
      const connectionsParser = new ConnectionsPageParser(page.documentIri, page.triples);

      return Promise.resolve(new ArrayIterator(connectionsParser.getConnections(travelMode)));
    };

    super(pageIterator, parsePageConnections);
  }
}
