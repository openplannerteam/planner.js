import IStopsProvider from "./IStopsProvider";

/**
 * Represents one data source of stops, e.g. De Lijn or NMBS
 * Has a prefix for potential use by a [[IStopsProvider]]
 * Extends [[IStopsProvider]] because it should implement the same methods
 */
export default interface IStopsFetcher extends IStopsProvider {
  prefix: string;
}
