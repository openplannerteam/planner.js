/// <reference types="node" />
import { EventEmitter } from "events";
/**
 * Proxies an internal EventEmitter (instead of extending EventEmitter) because
 * ´decorate(injectable(), EventEmitter)´ causes errors when running tests in Jest
 */
export default class EventBus implements EventEmitter {
    static getInstance(): EventBus;
    private static instance;
    private emitter;
    private constructor();
    eventNames(): Array<(string | symbol)>;
    rawListeners(event: string | symbol): Function[];
    getMaxListeners(): number;
    off(event: string | symbol, listener: (...args: any[]) => void): this;
    prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    prependListener(event: string | symbol, listener: (...args: any[]) => void): this;
    addListener(type: string | symbol, listener: any): this;
    emit(type: string | symbol, ...args: any[]): boolean;
    listenerCount(type: string | symbol): number;
    listeners(type: string | symbol): any[];
    on(type: string | symbol, listener: any): this;
    once(type: string | symbol, listener: any): this;
    removeAllListeners(type?: string | symbol): this;
    removeListener(type: string | symbol, listener: any): this;
    setMaxListeners(n: number): this;
}
