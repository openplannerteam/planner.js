import { IFootpathIndex } from "../../entities/footpaths/footpath";
import IStop from "../stops/IStop";

export default interface IFootpathsProvider {
  get: (stop: IStop) => Promise<IFootpathIndex>;
}
