import IStopsProvider from "./IStopsProvider";
/**
 * Represents one data source of stops, e.g. De Lijn or NMBS
 * Extends [[IStopsProvider]] because it should implement the same methods
 */
export default interface IStopsFetcher extends IStopsProvider {
}
