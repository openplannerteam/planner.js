import ILocation from "../interfaces/ILocation";

export default interface ILocationResolver {
  resolve: (location: ILocation | string) => Promise<ILocation>;
}
