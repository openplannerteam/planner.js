import { EventEmitter } from "events";
import { injectable } from "inversify";

/**
 * Proxies an internal EventEmitter (instead of extending EventEmitter) because
 * ´decorate(injectable(), EventEmitter)´ causes errors when running tests in Jest
 */
@injectable()
export default class EventBus implements EventEmitter {
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }

    return EventBus.instance;
  }

  private static instance: EventBus;
  private emitter: EventEmitter;

  private constructor() {
    this.emitter = new EventEmitter();
  }

  public eventNames(): Array<(string | symbol)> {
    return this.emitter.eventNames();
  }

  // tslint:disable-next-line: ban-types
  public rawListeners(event: string | symbol): Function[] {
    return this.emitter.rawListeners(event);
  }

  public getMaxListeners(): number {
    return this.emitter.getMaxListeners();
  }

  public off(event: string | symbol, listener: (...args: any[]) => void): this {
    this.emitter.off(event, listener);

    return this;
  }

  public prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this {
    this.emitter.prependOnceListener(event, listener);

    return this;
  }

  public prependListener(event: string | symbol, listener: (...args: any[]) => void): this {
    this.emitter.prependListener(event, listener);

    return this;
  }

  public addListener(type: string | symbol, listener: any): this {
    this.emitter.addListener(type, listener);

    return this;
  }

  public emit(type: string | symbol, ...args: any[]): boolean {
    return this.emitter.emit(type, ...args);
  }

  public listenerCount(type: string | symbol): number {
    return this.emitter.listenerCount(type);
  }

  public listeners(type: string | symbol): any[] {
    return this.emitter.listeners(type);
  }

  public on(type: string | symbol, listener: any): this {
    this.emitter.on(type, listener);

    return this;
  }

  public once(type: string | symbol, listener: any): this {
    this.emitter.once(type, listener);

    return this;
  }

  public removeAllListeners(type?: string | symbol): this {
    this.emitter.removeAllListeners(type);

    return this;
  }

  public removeListener(type: string | symbol, listener: any): this {
    this.emitter.removeListener(type, listener);

    return this;
  }

  public setMaxListeners(n: number): this {
    this.emitter.setMaxListeners(n);

    return this;
  }
}
