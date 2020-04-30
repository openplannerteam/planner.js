import { AsyncIterator, BufferedIterator } from "asynciterator";
import { PromiseProxyIterator } from "asynciterator-promiseproxy";
import { EventEmitter } from "events";
import { IConnectionsSourceConfig, IStopsSourceConfig } from "../../Catalog";
import defaultContainer from "../../configs/default";
import Context from "../../Context";
import TravelMode from "../../enums/TravelMode";
import EventBus from "../../events/EventBus";
import EventType from "../../events/EventType";
import ICatalogProvider from "../../fetcher/catalog/ICatalogProvider";
import IConnectionsProvider from "../../fetcher/connections/IConnectionsProvider";
import ProfileProvider from "../../fetcher/profiles/ProfileProviderDefault";
import IStop from "../../fetcher/stops/IStop";
import IStopsProvider from "../../fetcher/stops/IStopsProvider";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import IQuery from "../../interfaces/IQuery";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IQueryRunner from "../../query-runner/IQueryRunner";
import TYPES from "../../types";
import { GTFS, LC } from "../../uri/constants";
import URI from "../../uri/uri";
import Iterators from "../../util/Iterators";
import Units from "../../util/Units";
import Path from "../Path";
import IRoadPlanner from "../road/IRoadPlanner";

/*
          ,-.
          `-'
          /|\
           |                ,-------.             ,-----------.
          / \               |Planner|             |QueryRunner|
      Application           `---+---'             `-----+-----'
           |       query        |                       |
           |------------------->|                       |
           |                    |                       |
           |                    |      run(query)       |
           |                    |---------------------->|
           |                    |                       |
           |                    |           ,----------------------!.
           |                    |           |Resolve ids to objects|_\
           |                    |           `------------------------'
           |                    |                       ----.
           |                    |                           | resolveQuery(query)
           |                    |                       <---'
           |                    |                       |
           |           ,---------------------------------------------------------------!.
           |           |Query is delegated to RoadPlanner or PublicTransportPlanner now|_\
           |           `-----------------------------------------------------------------'
          ,-----------------------------------------!.  |
          |Add context, intermediate path steps, ...|_\ |
          `-------------------------------------------' |
           |                    ----.                   |
           |                        | completePath(path)|
           |                    <---'                   |
           |                    |                       |
           |                    |                       |

*/

/**
 * Allows to ask route planning queries. Emits events defined in [[EventType]]
 */
export default abstract class Planner {
  public static Units = Units;

  private activeProfileID: string;
  private context: Context;
  private eventBus: EventEmitter;
  private queryRunner: IQueryRunner;
  private profileProvider: ProfileProvider;
  private roadPlanner: IRoadPlanner;
  private connectionsProvider: IConnectionsProvider;
  private stopsProvider: IStopsProvider;
  private locationResolver: ILocationResolver;
  private catalogProvider: ICatalogProvider;

  /**
   * Initializes a new Planner
   * @param container The container of dependencies we are working with
   */
  constructor(container = defaultContainer) {
    // Store container on context before doing anything else
    this.context = container.get<Context>(TYPES.Context);
    this.context.setContainer(container);

    this.queryRunner = container.get<IQueryRunner>(TYPES.QueryRunner);
    this.profileProvider = container.get<ProfileProvider>(TYPES.ProfileProvider);
    this.eventBus = EventBus.getInstance();
    this.roadPlanner = container.get<IRoadPlanner>(TYPES.RoadPlanner);
    this.connectionsProvider = container.get<IConnectionsProvider>(TYPES.ConnectionsProvider);
    this.catalogProvider = container.get<ICatalogProvider>(TYPES.CatalogProvider);
    this.stopsProvider = container.get<IStopsProvider>(TYPES.StopsProvider);
    this.locationResolver = container.get<ILocationResolver>(TYPES.LocationResolver);

    this.activeProfileID = "https://hdelva.be/profile/pedestrian";
  }

  public addConnectionSource(accessUrl: string, travelMode = TravelMode.Train) {
    this.connectionsProvider.addConnectionSource({ accessUrl, travelMode });
  }

  public addStopSource(accessUrl: string) {
    this.stopsProvider.addStopSource({ accessUrl });
  }

  public getConnectionSources(): IConnectionsSourceConfig[] {
    return this.connectionsProvider.getSources();
  }

  public getStopsSources(): IStopsSourceConfig[] {
    return this.stopsProvider.getSources();
  }

  public async addCatalogSource(accessUrl: string) {
    const catalog = await this.catalogProvider.getCatalog(accessUrl);
    for (const dataset of catalog.datasets) {
      for (const distribution of dataset.distributions) {
        if (dataset.subject === URI.inNS(LC, "Connection")) {
          this.connectionsProvider.addConnectionSource(
            { accessUrl: distribution.accessUrl, travelMode: TravelMode.Train },
          );
        } else if (dataset.subject === URI.inNS(GTFS, "Stop")) {
          this.stopsProvider.addStopSource(
            { accessUrl: distribution.accessUrl },
          );
        }
      }
    }
  }

  public async completePath(path: IPath): Promise<IPath> {
    const completePath = Path.create();

    let walkingDeparture;
    let walkingDestination;

    for (const leg of path.legs) {
      if (leg.getTravelMode() === TravelMode.Walking) {
        if (!walkingDeparture) {
          walkingDeparture = leg.getStartLocation();
        }
        walkingDestination = leg.getStopLocation();
      } else {
        if (walkingDestination) {
          const walkingPathIterator = await this.roadPlanner.plan({
            from: [walkingDeparture],
            to: [walkingDestination],
            profileID: this.activeProfileID,
          });
          const walkingPaths = await Iterators.toArray(walkingPathIterator);
          for (const walkingLeg of walkingPaths[0].legs) {
            completePath.appendLeg(walkingLeg);
          }
          completePath.updateContext(walkingPaths[0].getContext());

          walkingDeparture = null;
          walkingDestination = null;
        }

        completePath.appendLeg(leg);
      }
    }

    if (walkingDestination) {
      const walkingPathIterator = await this.roadPlanner.plan({
        from: [walkingDeparture],
        to: [walkingDestination],
        profileID: this.activeProfileID,
      });
      const walkingPaths = await Iterators.toArray(walkingPathIterator);
      for (const walkingLeg of walkingPaths[0].legs) {
        completePath.appendLeg(walkingLeg);
      }
      completePath.updateContext(walkingPaths[0].getContext());

      walkingDeparture = null;
      walkingDestination = null;
    }

    return completePath;
  }

  /**
   * Given an [[IQuery]], it will evaluate the query and return a promise for an AsyncIterator of [[IPath]] instances
   * @param query An [[IQuery]] specifying a route planning query
   * @returns An [[AsyncIterator]] of [[IPath]] instances
   */
  public query(query: IQuery): AsyncIterator<IPath> {
    this.eventBus.emit(EventType.Query, query);

    query.profileID = this.activeProfileID;
    const pathIterator = new PromiseProxyIterator(() => this.queryRunner.run(query));

    this.eventBus.once(EventType.AbortQuery, () => {
      pathIterator.close();
    });

    pathIterator.on("error", (e) => {
      if (e && e.eventType) {
        this.eventBus.emit(e.eventType, e.message);
      }
    });

    if (query.minimized) {
      return pathIterator;
    }

    const completeIterator: BufferedIterator<IPath> = new BufferedIterator();

    pathIterator.on("data", async (path) => {
      const completePath = await this.completePath(path);
      completeIterator._push(completePath);

      if (pathIterator.closed) {
        completeIterator.close();
      }
    });

    return completeIterator;
  }

  public prefetchStops(): void {
    const container = this.context.getContainer();
    const stopsProvider = container.get<IStopsProvider>(TYPES.StopsProvider);

    if (stopsProvider) {
      stopsProvider.prefetchStops();
    }
  }

  public prefetchConnections(from: Date, to: Date): void {
    this.connectionsProvider.prefetchConnections(from, to);
  }

  public async setDevelopmentProfile(blob: object) {
    const profileID = await this.profileProvider.parseDevelopmentProfile(blob);
    return this.setProfileID(profileID);
  }

  public setProfileID(profileID: string) {
    this.activeProfileID = profileID;
    return this;
  }

  public getAllStops(): Promise<IStop[]> {
    // fixme, why is this here?
    // is this just for visualizations?
    const container = this.context.getContainer();
    const stopsProvider = container.get<IStopsProvider>(TYPES.StopsProvider);

    if (stopsProvider) {
      return stopsProvider.getAllStops();
    }

    return Promise.reject();
  }

  public resolveLocation(id: string): Promise<ILocation> {
    return this.locationResolver.resolve(id);
  }
}
