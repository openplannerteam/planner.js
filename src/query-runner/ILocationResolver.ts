import IStop from "../fetcher/stops/IStop";
import ILocation from "../interfaces/ILocation";

export default interface ILocationResolver {
  resolve: (location: ILocation | IStop | string) => Promise<ILocation>;
}
