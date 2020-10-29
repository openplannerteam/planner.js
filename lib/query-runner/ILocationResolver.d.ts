import IStop from "../fetcher/stops/IStop";
import ILocation from "../interfaces/ILocation";
/**
 * A location resolver turns an [[ILocation]], [[IStop]] or a string into an [[ILocation]]
 */
export default interface ILocationResolver {
    resolve: (location: ILocation | IStop | string) => Promise<ILocation>;
}
