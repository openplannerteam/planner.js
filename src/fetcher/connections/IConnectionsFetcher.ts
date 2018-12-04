import IConnectionsProvider from "./IConnectionsProvider";

/**
 * Entry point for fetching linked connections ([[IConnection]]s)
 * Serves as interface for dependency injection, so all implementations should have @injectable() decorator
 */
export default interface IConnectionsFetcher extends IConnectionsProvider {
}
