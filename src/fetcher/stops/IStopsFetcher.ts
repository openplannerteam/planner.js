import IStopsFetcherMediator from "./IStopsFetcherMediator";

/**
 * Represents one data source of stops, e.g. De Lijn or NMBS
 * Has a prefix for potential use by a [[IStopsFetcherMediator]]
 * Extends [[IStopsFetcherMediator]] because it should implement the same methods
 */
export default interface IStopsFetcher extends IStopsFetcherMediator {
  prefix: string;
}
