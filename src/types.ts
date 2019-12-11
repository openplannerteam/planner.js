import TravelMode from "./enums/TravelMode";
import IConnectionsFetcher from "./fetcher/connections/IConnectionsFetcher";
import IStopsFetcher from "./fetcher/stops/IStopsFetcher";
import IRoutableTileFetcher from "./fetcher/tiles/IRoutableTileFetcher";

const TYPES = {
  EventBus: Symbol("EventBus"),
  Context: Symbol("Context"),
  QueryRunner: Symbol("QueryRunner"),
  LocationResolver: Symbol("LocationResolver"),

  HydraTemplateFetcher: Symbol("HydraTemplateFetcher"),

  ConnectionsProvider: Symbol("ConnectionsProvider"),
  ConnectionsFetcher: Symbol("ConnectionsFetcher"),
  ConnectionsFetcherFactory: Symbol("ConnectionsFetcherFactory"),

  StopsProvider: Symbol("StopsProvider"),
  StopsFetcher: Symbol("StopsFetcher"),
  StopsFetcherFactory: Symbol("StopsFetcherFactory"),

  RoutableTileProvider: Symbol("TileProvider"),
  RoutableTileFetcher: Symbol("TileFetcher"),

  FootpathsProvider: Symbol("FootpathsProvider"),

  PublicTransportPlanner: Symbol("PublicTransportPlanner"),
  PublicTransportPlannerFactory: Symbol("PublicTransportPlannerFactory"),

  ProfileFetcher: Symbol("ProfileFetcher"),
  ProfileProvider: Symbol("ProfileProvider"),
  RoadPlanner: Symbol("RoadPlanner"),
  RoadPlannerFactory: Symbol("RoadPlannerFactory"),
  PathfinderProvider: Symbol("PathfinderProvider"),
  ShortestPathAlgorithm: Symbol("ShortestPathAlgorithm"),
  ShortestPathTreeAlgorithm: Symbol("ShortestPathTreeAlgorithm"),

  ReachableStopsFinder: Symbol("ReachableStopsFinder"),
  JourneyExtractor: Symbol("JourneyExtractor"),
  LDFetch: Symbol("LDFetch"),
  LDLoader: Symbol("LDLoader"),
  Catalog: Symbol("Catalog"),
};

export default TYPES;

export type StopsFetcherFactory = (accessUrl: string) => IStopsFetcher;
export type ConnectionsFetcherFactory = (travelMode: TravelMode) => IConnectionsFetcher;
