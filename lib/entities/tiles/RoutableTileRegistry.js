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
var RoutableTileRegistry_1;
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
let RoutableTileRegistry = RoutableTileRegistry_1 = class RoutableTileRegistry {
    constructor() {
        this.nodes = {};
        this.ways = {};
    }
    static getInstance() {
        if (!RoutableTileRegistry_1.instance) {
            RoutableTileRegistry_1.instance = new RoutableTileRegistry_1();
        }
        return RoutableTileRegistry_1.instance;
    }
    registerNode(node) {
        this.nodes[node.id] = node;
    }
    registerWay(way) {
        if (!this.ways[way.id]) {
            this.ways[way.id] = way;
        }
        else {
            // creates a new Way instance
            // avoids overwriting data from the individual tile definitions
            // otherwise ways might refer to nodes that aren't in the tile
            this.ways[way.id] = way.mergeDefinitions(this.ways[way.id]);
        }
    }
    getNode(id) {
        return this.nodes[id];
    }
    getWay(id) {
        return this.ways[id];
    }
    getNodes() {
        return Object.values(this.nodes);
    }
    getWays() {
        return Object.values(this.ways);
    }
};
RoutableTileRegistry = RoutableTileRegistry_1 = __decorate([
    inversify_1.injectable(),
    __metadata("design:paramtypes", [])
], RoutableTileRegistry);
exports.default = RoutableTileRegistry;
//# sourceMappingURL=RoutableTileRegistry.js.map