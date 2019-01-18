/**
 * Options passed to [[IConnectionsProvider]] and [[IConnectionsFetcherInstances]] instances to
 */
export default interface IConnectionsIteratorOptions {
  upperBoundDate?: Date;
  lowerBoundDate?: Date;
  backward?: boolean;
}
