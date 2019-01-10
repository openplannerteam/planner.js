// @ts-ignore
import { EventEmitter, Listener } from "events";
import { Container, injectable } from "inversify";
import EventType from "./EventType";

/**
 * The Context serves as event pass through and holder of the inversify container object.
 * Proxies an internal EventEmitter because ´decorate(injectable(), EventEmitter)´ causes
 * errors when running tests in Jest
 */
@injectable()
// @ts-ignore
export default class Context implements EventEmitter {
  private emitter: EventEmitter;
  private container: Container;

  constructor() {
    this.emitter = new EventEmitter();
  }

  public setContainer(container: Container) {
    this.container = container;
  }

  public getContainer() {
    return this.container;
  }

  public addListener(type: string | symbol, listener: Listener): this {
    this.emitter.addListener(type, listener);

    return this;
  }

  public emit(type: string | symbol, ...args: any[]): boolean {
    return this.emitter.emit(type, ...args);
  }

  public emitWarning(...args: any[]): boolean {
    return this.emit(EventType.Warning, ...args);
  }

  public listenerCount(type: string | symbol): number {
    return this.emitter.listenerCount(type);
  }

  public listeners(type: string | symbol): Listener[] {
    return this.emitter.listeners(type);
  }

  public on(type: string | symbol, listener: Listener): this {
    this.emitter.on(type, listener);

    return this;
  }

  public once(type: string | symbol, listener: Listener): this {
    this.emitter.once(type, listener);

    return this;
  }

  public removeAllListeners(type?: string | symbol): this {
    this.emitter.removeAllListeners(type);

    return this;
  }

  public removeListener(type: string | symbol, listener: Listener): this {
    this.emitter.removeListener(type, listener);

    return this;
  }

  public setMaxListeners(n: number): this {
    this.emitter.setMaxListeners(n);

    return this;
  }
}
