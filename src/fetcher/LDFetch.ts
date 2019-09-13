import { EventEmitter } from "events";
import { inject, injectable } from "inversify";
import LDFetchBase from "ldfetch";
import { Triple } from "rdf-js";
import EventType from "../events/EventType";
import TYPES from "../types";

export interface ILDFetchResponse {
  triples: Triple[];
  prefixes: object;
  statusCode: string;
  url: string;
}

/**
 * Proxies an ldfetch instance to transform its events
 */
@injectable()
export default class LDFetch implements LDFetchBase {
  private eventBus: EventEmitter;
  private ldFetchBase: LDFetchBase;
  private httpStartTimes: { [url: string]: Date };

  constructor(
    @inject(TYPES.EventBus) eventBus: EventEmitter,
  ) {
    this.ldFetchBase = new LDFetchBase({ headers: { Accept: "application/ld+json" } });
    this.eventBus = eventBus;

    this.setupEvents();
  }

  public get(url: string): Promise<ILDFetchResponse> {
    return this.ldFetchBase.get(url);
  }

  private setupEvents(): void {
    this.httpStartTimes = {};

    this.ldFetchBase.on("request", (url) => this.httpStartTimes[url] = new Date());
    this.ldFetchBase.on("redirect", (obj) => this.httpStartTimes[obj.to] = this.httpStartTimes[obj.from]);
    this.ldFetchBase.on("response", (url) => {
      const duration = (new Date()).getTime() - this.httpStartTimes[url].getTime();

      this.eventBus.emit(EventType.LDFetchGet, url, duration);
    });
  }
}
