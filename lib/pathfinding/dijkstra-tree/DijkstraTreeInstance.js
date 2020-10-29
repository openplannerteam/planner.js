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
const tinyqueue_1 = __importDefault(require("tinyqueue"));
const graph_1 = __importDefault(require("../graph"));
let DijkstraTreeInstance = class DijkstraTreeInstance {
    constructor(graph) {
        this.graph = graph;
        this.useWeightedCost = true;
    }
    setUseWeightedCost(useWeightedCost) {
        this.useWeightedCost = useWeightedCost;
    }
    setBreakPoint(on, callback) {
        this.graph.setBreakPoint(on, callback);
    }
    removeBreakPoint(on) {
        this.graph.removeBreakPoint(on);
    }
    async start(from, maxCost) {
        this.costs = [...Array(this.graph.getAdjacencyList().length)].fill(Infinity);
        this.previousNodes = [...Array(this.graph.getAdjacencyList().length)].fill(undefined);
        const fromIndex = this.graph.getNodeIndex(from);
        this.costs[fromIndex] = 0;
        this.nextQueue = [{ distance: 0, duration: 0, cost: 0, position: fromIndex }];
        return this.continue(maxCost);
    }
    async continue(maxCost) {
        const queue = new tinyqueue_1.default(this.nextQueue, (a, b) => a.duration - b.duration);
        this.nextQueue = [];
        while (queue.length) {
            const { position, distance, duration, cost } = queue.pop();
            if (duration > this.getCost(position)) {
                // we have already found a better way
                continue;
            }
            if (this.graph.getBreakPoint(position)) {
                await this.graph.getBreakPoint(position)(this.graph.getLabel(position));
            }
            if (cost > maxCost) {
                // remember this state for subsequent calls
                this.nextQueue.push({ duration, distance, cost, position });
            }
            else {
                for (const edge of this.graph.getAdjacencyList()[position]) {
                    const next = {
                        distance: distance + edge.distance,
                        duration: duration + edge.duration,
                        cost: cost + edge.cost,
                        position: edge.node,
                        previousPosition: position,
                    };
                    if (next.duration < this.getCost(next.position)) {
                        queue.push(next);
                        this.costs[next.position] = next.duration;
                        this.previousNodes[next.position] = position;
                        if (this.graph.getBreakPoint(next.position)) {
                            this.graph.getBreakPoint(next.position)(this.graph.getLabel(next.position));
                        }
                    }
                }
            }
        }
        const result = {};
        for (const [position, cost] of this.costs.entries()) {
            const label = this.graph.getLabel(position);
            const previousLabel = this.graph.getLabel(this.previousNodes[position]);
            result[label] = { duration: cost, previousNode: previousLabel };
        }
        return result;
    }
    getCost(position) {
        if (position >= this.costs.length) {
            const missingCosts = this.graph.getAdjacencyList().length - this.costs.length;
            this.costs = this.costs.concat([...Array(missingCosts)].fill(Infinity));
            this.previousNodes = this.previousNodes.concat([...Array(missingCosts)].fill(undefined));
        }
        return this.costs[position];
    }
};
DijkstraTreeInstance = __decorate([
    inversify_1.injectable(),
    __metadata("design:paramtypes", [graph_1.default])
], DijkstraTreeInstance);
exports.default = DijkstraTreeInstance;
//# sourceMappingURL=DijkstraTreeInstance.js.map