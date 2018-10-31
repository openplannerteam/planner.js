import IConnection from "./IConnection";
import IConnectionsFetcherConfig from "./IConnectionsFetcherConfig";

export default interface IConnectionsFetcher extends AsyncIterable<IConnection> {
  setConfig: (config: IConnectionsFetcherConfig) => void;
}
