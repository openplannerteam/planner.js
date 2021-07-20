import GeometryValue from "../../entities/tree/geometry";
import TravelMode from "../../enums/TravelMode";
/**
 * Options passed to [[IConnectionsProvider]] and [[IConnectionsFetcher]] instances
 * for creating AsyncIterators of [[IConnection]] instances.
 */
export default interface IConnectionsIteratorOptions {
    upperBoundDate?: Date;
    lowerBoundDate?: Date;
    mementoDate?: Date;
    backward?: boolean;
    excludedModes?: Set<TravelMode>;
    region: GeometryValue;
}
