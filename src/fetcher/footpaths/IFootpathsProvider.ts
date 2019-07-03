import { IFootpathIndex } from "../../entities/footpaths/footpath";

export default interface IFootpathsProvider {
  prefetch: () => void;
  get: () => Promise<IFootpathIndex>;
}
