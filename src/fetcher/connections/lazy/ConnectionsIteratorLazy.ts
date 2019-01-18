import { ArrayIterator } from "asynciterator";
import LdFetch from "ldfetch";
import TravelMode from "../../../enums/TravelMode";
import FlatMapIterator from "../../../util/iterators/FlatMapIterator";
import ConnectionsPageParser from "../hydra/ConnectionsPageParser";
import HydraPageIterator from "../hydra/HydraPageIterator";
import IHydraPage from "../hydra/IHydraPage";
import IHydraPageIteratorConfig from "../hydra/IHydraPageIteratorConfig";
import IConnection from "../IConnection";
import IConnectionsIteratorOptions from "../IConnectionsIteratorOptions";

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
    options: IConnectionsIteratorOptions,
  ) {
    const departureTimeDate = options.backward ?
      options.upperBoundDate : options.lowerBoundDate;

    const pageIteratorConfig: IHydraPageIteratorConfig = {
      backward: options.backward,
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
