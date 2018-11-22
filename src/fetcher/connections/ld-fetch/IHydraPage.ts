import IConnection from "../IConnection";

export default interface IHydraPage {
  index: number;
  documentIri: string;
  connections: IConnection[];
}
