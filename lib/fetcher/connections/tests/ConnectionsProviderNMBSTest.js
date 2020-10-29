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
Object.defineProperty(exports, "__esModule", { value: true });
const asynciterator_1 = require("asynciterator");
const inversify_1 = require("inversify");
let ConnectionsProviderNMBSTest = class ConnectionsProviderNMBSTest {
    constructor(connections) {
        this.connections = [];
        this.s = {};
        this.connections = connections;
    }
    getSources() {
        throw new Error("Method not implemented.");
    }
    appendIterator(options, existingIterator) {
        throw new Error("Method not implemented.");
    }
    addConnectionSource(source) {
        throw new Error("Method not implemented.");
    }
    getByUrl(url) {
        throw new Error("Method not implemented.");
    }
    getByTime(date) {
        throw new Error("Method not implemented.");
    }
    prefetchConnections() {
        return;
    }
    async createIterator(options) {
        let array = this.connections
            .map((r) => r.value);
        if (options.backward) {
            array = array.reverse();
        }
        return new asynciterator_1.ArrayIterator(array);
    }
};
ConnectionsProviderNMBSTest = __decorate([
    inversify_1.injectable(),
    __metadata("design:paramtypes", [Array])
], ConnectionsProviderNMBSTest);
exports.default = ConnectionsProviderNMBSTest;
//# sourceMappingURL=ConnectionsProviderNMBSTest.js.map