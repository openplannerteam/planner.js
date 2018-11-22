import IConnection from "./IConnection";
import IConnectionsFetcherConfig from "./IConnectionsFetcherConfig";

/**
 * Entry point for fetching linked connections ([[IConnection]]s)
 * Serves as interface for dependency injection, so all implementations should have @injectable() decorator
 * @extends AsyncIterable<IConnection>
 */
export default interface IConnectionsFetcher extends AsyncIterable<IConnection> {
  setConfig: (config: IConnectionsFetcherConfig) => void;
}
