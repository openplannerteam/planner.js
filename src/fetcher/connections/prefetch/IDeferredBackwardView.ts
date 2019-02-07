import { AsyncIterator } from "asynciterator";
import IConnection from "../IConnection";

export default interface IDeferredBackwardView {
  lowerBoundDate: Date;
  upperBoundDate: Date;
  resolve: (iterator: AsyncIterator<IConnection>) => void;
}
