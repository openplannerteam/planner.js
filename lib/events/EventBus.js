"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EventBus_1;
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const inversify_1 = require("inversify");
/**
 * Proxies an internal EventEmitter (instead of extending EventEmitter) because
 * ´decorate(injectable(), EventEmitter)´ causes errors when running tests in Jest
 */
let EventBus = EventBus_1 = class EventBus {
    constructor() {
        this.emitter = new events_1.EventEmitter();
    }
    static getInstance() {
        if (!EventBus_1.instance) {
            EventBus_1.instance = new EventBus_1();
        }
        return EventBus_1.instance;
    }
    eventNames() {
        return this.emitter.eventNames();
    }
    // tslint:disable-next-line: ban-types
    rawListeners(event) {
        return this.emitter.rawListeners(event);
    }
    getMaxListeners() {
        return this.emitter.getMaxListeners();
    }
    off(event, listener) {
        this.emitter.off(event, listener);
        return this;
    }
    prependOnceListener(event, listener) {
        this.emitter.prependOnceListener(event, listener);
        return this;
    }
    prependListener(event, listener) {
        this.emitter.prependListener(event, listener);
        return this;
    }
    addListener(type, listener) {
        this.emitter.addListener(type, listener);
        return this;
    }
    emit(type, ...args) {
        return this.emitter.emit(type, ...args);
    }
    listenerCount(type) {
        return this.emitter.listenerCount(type);
    }
    listeners(type) {
        return this.emitter.listeners(type);
    }
    on(type, listener) {
        this.emitter.on(type, listener);
        return this;
    }
    once(type, listener) {
        this.emitter.once(type, listener);
        return this;
    }
    removeAllListeners(type) {
        this.emitter.removeAllListeners(type);
        return this;
    }
    removeListener(type, listener) {
        this.emitter.removeListener(type, listener);
        return this;
    }
    setMaxListeners(n) {
        this.emitter.setMaxListeners(n);
        return this;
    }
};
EventBus = EventBus_1 = __decorate([
    inversify_1.injectable(),
    __metadata("design:paramtypes", [])
], EventBus);
exports.default = EventBus;
//# sourceMappingURL=EventBus.js.map