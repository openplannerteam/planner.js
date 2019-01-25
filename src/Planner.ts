import { AsyncIterator } from "asynciterator";
// @ts-ignore
import { EventEmitter, Listener } from "events";
import Context from "./Context";
import EventType from "./enums/EventType";
import IConnectionsProvider from "./fetcher/connections/IConnectionsProvider";
import IStop from "./fetcher/stops/IStop";
import IStopsProvider from "./fetcher/stops/IStopsProvider";
import IPath from "./interfaces/IPath";
import IQuery from "./interfaces/IQuery";
import defaultContainer from "./inversify.config";
import IQueryRunner from "./query-runner/IQueryRunner";
import TYPES from "./types";

/**
 * Allows to ask route planning queries. Emits events defined in [[EventType]]
 */
// @ts-ignore
export default class Planner implements EventEmitter {
  private context: Context;
  private queryRunner: IQueryRunner;

  /**
   * Initializes a new Planner
   * @param container The container of dependencies we are working with
   */
  constructor(container = defaultContainer) {
    // Store container on context before doing anything else
    this.context = container.get<Context>(TYPES.Context);
    this.context.setContainer(container);

    this.queryRunner = container.get<IQueryRunner>(TYPES.QueryRunner);
  }

  /**
   * Given an [[IQuery]], it will evaluate the query and return a promise for an AsyncIterator of [[IPath]] instances
   * @param query An [[IQuery]] specifying a route planning query
   * @returns An AsyncIterator of [[IPath]] instances
   */
  public async query(query: IQuery): Promise<AsyncIterator<IPath>> {
    this.emit(EventType.Query, query);

    try {
      const iterator = await this.queryRunner.run(query);

      this.once(EventType.AbortQuery, () => {
        iterator.close();
      });

      return iterator;

    } catch (e) {
      if (e && e.eventType) {
        this.context.emit(e.eventType, e.message);
      }

      return Promise.reject(e);
    }
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

  public getAllStops(): Promise<IStop[]> {
    const container = this.context.getContainer();
    const stopsProvider = container.get<IStopsProvider>(TYPES.StopsProvider);

    if (stopsProvider) {
      return stopsProvider.getAllStops();
    }

    return Promise.reject();
  }

}
