import { inject, injectable } from "inversify";
import RoutableTileRegistry from "../entities/tiles/RoutableTileRegistry";
import LocationResolverError from "../errors/LocationResolverError";
import IStop from "../fetcher/stops/IStop";
import IStopsProvider from "../fetcher/stops/IStopsProvider";
import ILocation from "../interfaces/ILocation";
import TYPES from "../types";
import ILocationResolver from "./ILocationResolver";

/**
 * This default location resolver resolves [[ILocation]] instances by their `id` (`http(s)://...`)
 *
 * If only an `id` string is passed, it returns an [[ILocation]] with all available information.
 *
 * If an incomplete [[ILocation]] (but with an `id`) is passed, it gets supplemented as well.
 */
@injectable()
export default class LocationResolverDefault implements ILocationResolver {
  private readonly stopsProvider: IStopsProvider;
  private readonly tileRegistry: RoutableTileRegistry;

  constructor(
    @inject(TYPES.StopsProvider) stopsProvider: IStopsProvider,
  ) {
    this.stopsProvider = stopsProvider;
    this.tileRegistry = RoutableTileRegistry.getInstance();
  }

  public async resolve(input: ILocation | IStop | string): Promise<ILocation> {

    if (typeof input === "string") {

      if (this.isId(input)) {
        return this.resolveById(input);
      }

      return Promise.reject(new LocationResolverError(`Location "${input}" is a string, but not an ID`));
    }

    const location: ILocation = input;
    const hasId = "id" in location;
    const hasCoords = "latitude" in location && "longitude" in location;

    if (hasId) {
      const resolvedLocation = await this.resolveById(location.id);

      return Object.assign({}, location, resolvedLocation);
    }

    if (!hasCoords) {
      return Promise.reject(
        new LocationResolverError(`Location "${JSON.stringify(input)}" should have latitude and longitude`),
      );
    }

    if (typeof location.latitude !== "number") {
      location.latitude = parseFloat(location.latitude);
    }

    if (typeof location.longitude !== "number") {
      location.longitude = parseFloat(location.longitude);
    }

    return location;
  }

  private async resolveById(id: string): Promise<ILocation> {
    const node = this.tileRegistry.getNode(id);
    if (node) {
      return node;
    }

    const stop: IStop = await this.stopsProvider.getStopById(id);
    if (stop) {
      return stop;
    }

    return Promise.reject(new LocationResolverError(`No fetcher for id ${id}`));
  }

  private isId(testString: string): boolean {
    return testString.indexOf("http://") === 0 || testString.indexOf("https://") === 0;
  }
}
