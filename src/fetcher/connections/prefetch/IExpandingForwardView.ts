import IConnection from "../IConnection";

export default interface IExpandingForwardView {
  lowerBoundDate: Date;
  upperBoundDate: Date;
  tryExpand: (connection: IConnection, index: number) => boolean;
}
