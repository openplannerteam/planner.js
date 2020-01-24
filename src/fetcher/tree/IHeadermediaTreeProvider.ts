import HypermediaTree from "../../entities/tree/tree";

export default interface IHypermediaTreeProvider {
  addTreeSource(accessUrl: string);
  getAllTrees(): Promise<HypermediaTree[]>;
}
