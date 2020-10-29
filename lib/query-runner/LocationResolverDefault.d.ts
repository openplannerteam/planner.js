import IStop from "../fetcher/stops/IStop";
import IStopsProvider from "../fetcher/stops/IStopsProvider";
import ILocation from "../interfaces/ILocation";
import ILocationResolver from "./ILocationResolver";
/**
 * This default location resolver resolves [[ILocation]] instances by their `id` (`http(s)://...`)
 *
 * If only an `id` string is passed, it returns an [[ILocation]] with all available information.
 *
 * If an incomplete [[ILocation]] (but with an `id`) is passed, it gets supplemented as well.
 */
export default class LocationResolverDefault implements ILocationResolver {
    private readonly stopsProvider;
    private readonly tileRegistry;
    constructor(stopsProvider: IStopsProvider);
    resolve(input: ILocation | IStop | string): Promise<ILocation>;
    private resolveById;
    private isId;
}
