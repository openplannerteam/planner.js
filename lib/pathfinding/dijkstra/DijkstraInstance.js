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
const POSITION = 0;
const DISTANCE = 1;
const DURATION = 2;
const COST = 3;
/*
interface IState {
    position: number;
    distance: DistanceM;
    duration: DurationMs;
    cost: number;
}duration
*/
let DijkstraInstance = class DijkstraInstance {
    constructor(graph) {
        this.useWeightedCost = true;
        this.graph = graph;
        this.costs = new Float32Array();
        this.previousNodes = new Float32Array();
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
    async queryPath(from, to, maxDistance = Infinity) {
        let queue;
        if (this.useWeightedCost) {
            queue = new tinyqueue_1.default([], (a, b) => a[COST] - b[COST]);
        }
        else {
            queue = new tinyqueue_1.default([], (a, b) => a[DURATION] - b[DURATION]);
        }
        this.costs = this.costs.fill(Infinity);
        this.previousNodes = this.previousNodes.fill(undefined);
        const fromIndex = this.graph.getNodeIndex(from);
        this.setCost(fromIndex, 0);
        const state = new Float32Array(4);
        state[COST] = 0;
        state[POSITION] = fromIndex;
        state[DISTANCE] = 0;
        state[DURATION] = 0;
        queue.push(state);
        const toIndex = this.graph.getNodeIndex(to);
        while (queue.length) {
            const [position, distance, duration, cost] = queue.pop();
            if (distance > maxDistance) {
                // avoid hopeless searches
                break;
            }
            if (position === toIndex) {
                // it is done, break the loop and start reconstructing the path
                break;
            }
            if (cost > this.getCost(position)) {
                // we have already found a better way
                continue;
            }
            if (this.graph.getBreakPoint(position)) {
                await this.graph.getBreakPoint(position)(this.graph.getLabel(position));
            }
            for (const edge of this.graph.getAdjacencyList()[position]) {
                const next = new Float32Array(4);
                next[COST] = cost + edge.cost;
                next[POSITION] = edge.node;
                next[DISTANCE] = distance + edge.distance;
                next[DURATION] = duration + edge.duration;
                /*const next = {
                    distance: distance + edge.distance,
                    duration: duration + edge.duration,
                    cost: Math.fround(cost + edge.cost),
                    position: edge.node,
                };*/
                if (next[COST] < this.getCost(next[POSITION])) {
                    this.setCost(next[POSITION], next[COST]);
                    this.previousNodes[next[POSITION]] = position;
                    queue.push(next);
                }
            }
        }
        let currentPosition = toIndex;
        const steps = [];
        // reconstruct the path
        while (!isNaN(this.previousNodes[currentPosition])) {
            let nextEdge;
            let nextPositionCost = Infinity;
            let way;
            for (const edge of this.graph.getReverseAdjacencyList()[currentPosition]) {
                if (this.getCost(edge.node) < nextPositionCost) {
                    nextPositionCost = this.getCost(edge.node);
                    nextEdge = edge;
                    way = edge.through;
                }
            }
            if (!nextEdge) {
                break;
            }
            steps.push({
                from: this.graph.getLabel(nextEdge.node),
                to: this.graph.getLabel(currentPosition),
                distance: nextEdge.distance,
                duration: nextEdge.duration,
                through: way,
            });
            currentPosition = nextEdge.node;
        }
        return steps.reverse();
    }
    setCost(position, cost) {
        if (position >= this.costs.length) {
            const newCosts = new Float32Array(this.graph.getAdjacencyList().length)
                .fill(Infinity, this.costs.length);
            newCosts.set(this.costs);
            this.costs = newCosts;
            const newPrevious = new Float32Array(this.graph.getAdjacencyList().length)
                .fill(undefined, this.previousNodes.length);
            newPrevious.set(this.previousNodes);
            this.previousNodes = newPrevious;
        }
        this.costs[position] = cost;
    }
    getCost(position) {
        if (position >= this.costs.length) {
            const newCosts = new Float32Array(this.graph.getAdjacencyList().length)
                .fill(Infinity, this.costs.length);
            newCosts.set(this.costs);
            this.costs = newCosts;
            const newPrevious = new Float32Array(this.graph.getAdjacencyList().length)
                .fill(undefined, this.previousNodes.length);
            newPrevious.set(this.previousNodes);
            this.previousNodes = newPrevious;
        }
        return this.costs[position];
    }
};
DijkstraInstance = __decorate([
    inversify_1.injectable(),
    __metadata("design:paramtypes", [graph_1.default])
], DijkstraInstance);
exports.DijkstraInstance = DijkstraInstance;
//# sourceMappingURL=DijkstraInstance.js.map