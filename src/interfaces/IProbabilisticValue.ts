export default interface IProbabilisticValue {
  median?: number;
  average?: number;
  minimum?: number;
  maximum?: number;
  percentiles?: {[percentile: string]: number};
}
