import IStop from "../fetcher/stops/IStop";
import IStopsProvider from "../fetcher/stops/IStopsProvider";
import ILocation from "../interfaces/ILocation";
import ILocationResolver from "./ILocationResolver";
/**
 * Location resolver that allows stop names as input
 * Falls back to LocationResolverDefault
 */
export default class LocationResolverConvenience implements ILocationResolver {
    private readonly stopsProvider;
    private readonly defaultLocationResolver;
    private allStops;
    constructor(stopsProvider: IStopsProvider);
    resolve(input: ILocation | IStop | string): Promise<ILocation>;
    private isId;
}
