import IConnection from "./IConnection";

export default interface IConnectionsFetcher {
  fetch: () => AsyncIterator<IConnection>;
}
