import IConnection from "./IConnection";
import IConnectionsFetcherConfig from "./IConnectionsFetcherConfig";

/**
 * Entry point for fetching linked connections (IConnections)
 * Serves as interface for dependency injection
 * @extends AsyncIterable<IConnection>
 */
export default interface IConnectionsFetcher extends AsyncIterable<IConnection> {
  setConfig: (config: IConnectionsFetcherConfig) => void;
}
