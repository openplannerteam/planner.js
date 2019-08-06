import { AsyncIterator } from "asynciterator";
import { PromiseProxyIterator } from "asynciterator-promiseproxy";
// @ts-ignore
import { EventEmitter, Listener } from "events";
import Context from "./Context";
import EventType from "./events/EventType";
import IConnectionsProvider from "./fetcher/connections/IConnectionsProvider";
import ProfileProvider from "./fetcher/profiles/ProfileProviderDefault";
import IStop from "./fetcher/stops/IStop";
import IStopsProvider from "./fetcher/stops/IStopsProvider";
import IPath from "./interfaces/IPath";
import IQuery from "./interfaces/IQuery";
import defaultContainer from "./inversify.config";
import IQueryRunner from "./query-runner/IQueryRunner";
import TYPES from "./types";
import Units from "./util/Units";

/**
 * Allows to ask route planning queries. Emits events defined in [[EventType]]
 */
// @ts-ignore
export default class Planner implements EventEmitter {
  public static Units = Units;

  private activeProfileID: string;
  private context: Context;
  private eventBus: EventEmitter;
  private queryRunner: IQueryRunner;
  private profileProvider: ProfileProvider;

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
    this.eventBus = container.get<EventEmitter>(TYPES.EventBus);

    this.activeProfileID = "PEDESTRIAN";
  }

  /**
   * Given an [[IQuery]], it will evaluate the query and return a promise for an AsyncIterator of [[IPath]] instances
   * @param query An [[IQuery]] specifying a route planning query
   * @returns An [[AsyncIterator]] of [[IPath]] instances
   */
  public query(query: IQuery): AsyncIterator<IPath> {
    this.eventBus.emit(EventType.Query, query);

    query.profileID = this.activeProfileID;
    const iterator = new PromiseProxyIterator(() => this.queryRunner.run(query));

    this.eventBus.once(EventType.AbortQuery, () => {
      iterator.close();
    });

    iterator.on("error", (e) => {
      if (e && e.eventType) {
        this.eventBus.emit(e.eventType, e.message);
      }
    });

    return iterator;
  }

  public prefetchStops(): void {
    const container = this.context.getContainer();
    const stopsProvider = container.get<IStopsProvider>(TYPES.StopsProvider);

    if (stopsProvider) {
      stopsProvider.prefetchStops();
    }
  }

  public prefetchConnections(): void {
    const container = this.context.getContainer();
    const connectionsProvider = container.get<IConnectionsProvider>(TYPES.ConnectionsProvider);

    if (connectionsProvider) {
      connectionsProvider.prefetchConnections();
    }
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

}
