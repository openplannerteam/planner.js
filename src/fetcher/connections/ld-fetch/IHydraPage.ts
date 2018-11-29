import IConnection from "../IConnection";

export default interface IHydraPage {
  index: number;
  documentIri: string;
  nextPageIri?: string;
  previousPageIri?: string;
  connections: IConnection[];
}
