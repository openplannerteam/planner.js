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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const ldfetch_1 = __importDefault(require("ldfetch"));
const EventBus_1 = __importDefault(require("../events/EventBus"));
const EventType_1 = __importDefault(require("../events/EventType"));
/**
 * Proxies an ldfetch instance to transform its events
 */
let LDFetch = class LDFetch {
    constructor() {
        this.ldFetchBase = new ldfetch_1.default({ headers: { Accept: "application/ld+json" } });
        this.eventBus = EventBus_1.default.getInstance();
        this.setupEvents();
    }
    get(url) {
        return this.ldFetchBase.get(url);
    }
    setupEvents() {
        this.httpStartTimes = {};
        this.ldFetchBase.on("request", (url) => this.httpStartTimes[url] = new Date());
        this.ldFetchBase.on("redirect", (obj) => this.httpStartTimes[obj.to] = this.httpStartTimes[obj.from]);
        this.ldFetchBase.on("response", (url) => {
            const duration = (new Date()).getTime() - this.httpStartTimes[url].getTime();
            this.eventBus.emit(EventType_1.default.ResourceFetch, {
                url,
                duration,
            });
        });
    }
};
LDFetch = __decorate([
    inversify_1.injectable(),
    __metadata("design:paramtypes", [])
], LDFetch);
exports.default = LDFetch;
//# sourceMappingURL=LDFetch.js.map