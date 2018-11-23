import IConnection from "./IConnection";
import IConnectionsFetcherConfig from "./IConnectionsFetcherConfig";

/**
 * A IConnectionsProvider serves as interface to other classes that want to use [[IConnection]] instances
 * It does this by acting as a transparent proxy between the user class and the configured [[IConnectionFetcher]]
 * instances
 */
export default interface IConnectionsProvider extends AsyncIterable<IConnection> {
  setConfig: (config: IConnectionsFetcherConfig) => void;
}
