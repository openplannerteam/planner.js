import { Triple } from "rdf-js";

export default interface IHydraPage {
  index: number;
  documentIri: string;
  nextPageIri?: string;
  previousPageIri?: string;
  triples: Triple[];
}
