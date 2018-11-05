export default interface IProbabilisticValue<T> {
  median?: T;
  average?: T;
  minimum?: T;
  maximum?: T;
  percentiles?: {[percentile: string]: T};
}
