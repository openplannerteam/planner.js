import { injectable } from "inversify";
import ILocation from "../interfaces/ILocation";
import ILocationResolver from "./ILocationResolver";

@injectable()
export default class LocationResolverDefault implements ILocationResolver {

  public resolve(location: ILocation | string): ILocation {

    if (typeof location === "string") {

      if (location.indexOf("http://") === 0 || location.indexOf("https://") === 0) {
        return { id: location };
      }

      return { id: location };
    }

    if ("id" in (location as ILocation) || "address" in (location as ILocation)) {
      return location;
    }
  }
}
