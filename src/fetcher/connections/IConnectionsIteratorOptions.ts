/**
 * Options passed to [[IConnectionsProvider]] and [[IConnectionsFetcher]] instances
 * for creating AsyncIterators of [[IConnection]] instances.
 */
export default interface IConnectionsIteratorOptions {
  upperBoundDate?: Date;
  lowerBoundDate?: Date;
  backward?: boolean;
}
