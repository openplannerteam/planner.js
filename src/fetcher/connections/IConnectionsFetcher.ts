import IConnection from "./IConnection";

export default interface IConnectionsFetcher extends AsyncIterable<IConnection> {
}
