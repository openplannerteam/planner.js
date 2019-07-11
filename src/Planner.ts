import { AsyncIterator } from "asynciterator";
import { PromiseProxyIterator } from "asynciterator-promiseproxy";
// @ts-ignore
import { EventEmitter, Listener } from "events";
import Context from "./Context";
import EventType from "./enums/EventType";
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

  private context: Context;
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
  }

  /**
   * Given an [[IQuery]], it will evaluate the query and return a promise for an AsyncIterator of [[IPath]] instances
   * @param query An [[IQuery]] specifying a route planning query
   * @returns An [[AsyncIterator]] of [[IPath]] instances
   */
  public query(query: IQuery): AsyncIterator<IPath> {
    this.emit(EventType.Query, query);

    const iterator = new PromiseProxyIterator(() => this.queryRunner.run(query));

    this.once(EventType.AbortQuery, () => {
      iterator.close();
    });

    iterator.on("error", (e) => {
      if (e && e.eventType) {
        this.emit(e.eventType, e.message);
      }
    });

    return iterator;
  }

  public addListener(type: string | symbol, listener: Listener): this {
    this.context.addListener(type, listener);

    return this;
  }

  public emit(type: string | symbol, ...args: any[]): boolean {
    return this.context.emit(type, ...args);
  }

  public listenerCount(type: string | symbol): number {
    return this.context.listenerCount(type);
  }

  public listeners(type: string | symbol): Listener[] {
    return this.context.listeners(type);
  }

  public on(type: string | symbol, listener: Listener): this {
    this.context.on(type, listener);

    return this;
  }

  public once(type: string | symbol, listener: Listener): this {
    this.context.once(type, listener);

    return this;
  }

  public removeAllListeners(type?: string | symbol): this {
    this.context.removeAllListeners(type);

    return this;
  }

  public removeListener(type: string | symbol, listener: Listener): this {
    this.context.removeListener(type, listener);

    return this;
  }

  public setMaxListeners(n: number): this {
    this.context.setMaxListeners(n);

    return this;
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
    const profileID = await this.profileProvider.setDevelopmentProfile(blob);
    this.profileProvider.setActiveProfileID(profileID);

    return this;
  }

  public setProfileID(profileID: string) {
    this.profileProvider.setActiveProfileID(profileID);

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
