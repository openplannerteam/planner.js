import IStopsFetcher from "./fetcher/stops/IStopsFetcher";

const TYPES = {
  Context: Symbol("Context"),
  QueryRunner: Symbol("QueryRunner"),
  LocationResolver: Symbol("LocationResolver"),
  ConnectionsFetcher: Symbol("ConnectionsFetcher"),
  StopsFetcher: Symbol("StopsFetcher"),
  PublicTransportPlanner: Symbol("PublicTransportPlanner"),
  RoadPlanner: Symbol("RoadPlanner"),
  ReachableStopsFinder: Symbol("ReachableStopsFinder"),
  JourneyExtractor: Symbol("JourneyExtractor"),
  LDFetch: Symbol("LDFetch"),
  StopsProvider: Symbol("StopsProvider"),
  StopsFetcherFactory: Symbol("StopsFetcherFactory"),
  Catalog: Symbol("Catalog"),
};

export default TYPES;

export type StopsFetcherFactory = (prefix: string, accessUrl: string) => IStopsFetcher;
