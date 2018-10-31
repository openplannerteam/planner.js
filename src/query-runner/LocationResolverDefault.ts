import { inject, injectable } from "inversify";
import Context from "../Context";
import IStop from "../fetcher/stops/IStop";
import IStopsFetcher from "../fetcher/stops/IStopsFetcher";
import ILocation from "../interfaces/ILocation";
import TYPES from "../types";
import ILocationResolver from "./ILocationResolver";

@injectable()
export default class LocationResolverDefault implements ILocationResolver {
  private readonly stopsFetchers: IStopsFetcher[];

  constructor(@inject(TYPES.Context) context: Context) {
    this.stopsFetchers = context.getContainer()
      .getAll<IStopsFetcher>(TYPES.StopsFetcher);
  }

  public async resolve(input: ILocation | string): Promise<ILocation> {

    if (typeof input === "string") {

      if (this.isId(input)) {
        return this.resolveById(input);
      }

      return Promise.reject(`Location "${input}" is a string, but not an ID`);
    }

    const location: ILocation = input;
    const hasId = "id" in location;
    const hasCoords = "latitude" in location && "longitude" in location;

    if (hasId) {
      const resolvedLocation = await this.resolveById(location.id);

      return Object.assign({}, location, resolvedLocation);
    }

    if (!hasCoords) {
      return Promise.reject(`Location "${JSON.stringify(input)}" should have latitude and longitude`);
    }

    return location;
  }

  private async resolveById(id: string): Promise<ILocation> {
    const fetcher = this.determineStopFetcher(id);

    if (fetcher) {
      const stop: IStop = await fetcher.getStopById(id);

      if (stop) {
        return {
          id,
          latitude: stop.latitude,
          longitude: stop.longitude,
        };
      }
    }

    throw new Error(`No fetcher for id ${id}`);
  }

  private determineStopFetcher(id: string): IStopsFetcher {
    if (!this.stopsFetchers || !this.stopsFetchers.length) {
      return null;
    }

    for (const fetcher of this.stopsFetchers) {
      if (id.indexOf(fetcher.prefix) === 0) {
        return fetcher;
      }
    }
  }

  private isId(testString: string): boolean {
    return testString.indexOf("http://") === 0 || testString.indexOf("https://") === 0;
  }
}
