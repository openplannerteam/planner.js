import { EventEmitter } from "events";
import { injectable } from "inversify";
import LDFetchBase from "ldfetch";
import { Triple } from "rdf-js";
import EventBus from "../events/EventBus";
import EventType from "../events/EventType";

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

  constructor() {
    this.ldFetchBase = new LDFetchBase({ headers: { Accept: "application/ld+json" } });
    this.eventBus = EventBus.getInstance();

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

      this.eventBus.emit(EventType.ResourceFetch,
        {
          url,
          duration,
        });
    });
  }
}
