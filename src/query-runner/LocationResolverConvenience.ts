import { inject, injectable } from "inversify";
import RoutableTileRegistry from "../entities/tiles/RoutableTileRegistry";
import LocationResolverError from "../errors/LocationResolverError";
import IStop from "../fetcher/stops/IStop";
import IStopsProvider from "../fetcher/stops/IStopsProvider";
import ILocation from "../interfaces/ILocation";
import TYPES from "../types";
import ILocationResolver from "./ILocationResolver";
import LocationResolverDefault from "./LocationResolverDefault";

/**
 * Location resolver that allows stop names as input
 * Falls back to LocationResolverDefault
 */
@injectable()
export default class LocationResolverConvenience implements ILocationResolver {
  private readonly stopsProvider: IStopsProvider;
  private readonly defaultLocationResolver: ILocationResolver;

  private allStops: IStop[];

  constructor(
    @inject(TYPES.StopsProvider) stopsProvider: IStopsProvider,
  ) {
    this.stopsProvider = stopsProvider;
    this.defaultLocationResolver = new LocationResolverDefault(this.stopsProvider);
  }

  public async resolve(input: ILocation | IStop | string): Promise<ILocation> {
    if (typeof input === "string" && !this.isId(input)) {

      if (input.includes("geo:")) {
        const expression = /geo:([\-0-9.]+),([\-0-9.]+)/;
        const result = expression.exec(input);

        if (result && result.length) {
          return {
            latitude: parseFloat(result[1]),
            longitude: parseFloat(result[2]),
          };
        }
      }

      this.allStops = await this.stopsProvider.getAllStops();

      const matchingStop = this.allStops.find((stop: IStop) => stop.name === input);

      if (matchingStop) {
        return matchingStop;
      }

      return Promise.reject(
        new LocationResolverError(`Location "${input}" is a string, but not an ID and not a valid stop name`),
      );
    }

    return this.defaultLocationResolver.resolve(input);
  }

  private isId(testString: string): boolean {
    return testString.indexOf("http://") === 0 || testString.indexOf("https://") === 0;
  }
}
