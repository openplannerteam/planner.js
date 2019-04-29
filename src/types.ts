import TravelMode from "./enums/TravelMode";
import IConnectionsFetcher from "./fetcher/connections/IConnectionsFetcher";
import IStopsFetcher from "./fetcher/stops/IStopsFetcher";
import IRoutableTileFetcher from "./fetcher/tiles/IRoutableTileFetcher";

const TYPES = {
  Context: Symbol("Context"),
  QueryRunner: Symbol("QueryRunner"),
  LocationResolver: Symbol("LocationResolver"),

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

  RoadPlanner: Symbol("RoadPlanner"),
  RoadPlannerFactory: Symbol("RoadPlannerFactory"),
  Pathfinder: Symbol("Pathfinder"),

  ReachableStopsFinder: Symbol("ReachableStopsFinder"),
  JourneyExtractor: Symbol("JourneyExtractor"),
  LDFetch: Symbol("LDFetch"),
  LDLoader: Symbol("LDLoader"),
  Catalog: Symbol("Catalog"),
};

export default TYPES;

export type StopsFetcherFactory = (accessUrl: string) => IStopsFetcher;
export type ConnectionsFetcherFactory = (accessUrl: string, travelMode: TravelMode) => IConnectionsFetcher;
export type RoutableTilesFetcherFactory = (accesUrl: string) => IRoutableTileFetcher;
