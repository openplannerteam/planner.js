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
var StepResultKind;
(function (StepResultKind) {
    StepResultKind[StepResultKind["Continue"] = 0] = "Continue";
    StepResultKind[StepResultKind["Break"] = 1] = "Break";
    StepResultKind[StepResultKind["NodeHandled"] = 2] = "NodeHandled";
})(StepResultKind || (StepResultKind = {}));
let BidirDijkstraInstance = class BidirDijkstraInstance {
    constructor(graph) {
        this.useWeightedCost = true;
        this.graph = graph;
        this.forwardCosts = [];
        this.forwardParents = [];
        this.backwardCosts = [];
        this.backwardParents = [];
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
        let forwardQueue;
        let backwardQueue;
        if (this.useWeightedCost) {
            forwardQueue = new tinyqueue_1.default([], (a, b) => a.cost - b.cost);
            backwardQueue = new tinyqueue_1.default([], (a, b) => a.cost - b.cost);
        }
        else {
            forwardQueue = new tinyqueue_1.default([], (a, b) => a.duration - b.duration);
            backwardQueue = new tinyqueue_1.default([], (a, b) => a.duration - b.duration);
        }
        this.forwardCosts = this.forwardCosts.fill(Infinity);
        this.forwardParents = this.forwardParents.fill(undefined);
        this.backwardCosts = this.backwardCosts.fill(Infinity);
        this.backwardParents = this.backwardParents.fill(undefined);
        const fromIndex = this.graph.getNodeIndex(from);
        const toIndex = this.graph.getNodeIndex(to);
        this.setForwardCost(fromIndex, 0);
        this.setBackwardCost(toIndex, 0);
        forwardQueue.push({ distance: 0, duration: 0, cost: 0, position: fromIndex });
        backwardQueue.push({ distance: 0, duration: 0, cost: 0, position: toIndex });
        while (forwardQueue.length && backwardQueue.length) {
            const [forwardResult, backwardResult] = await Promise.all([
                this.forwardStep(forwardQueue, toIndex, maxDistance),
                this.backwardStep(backwardQueue, fromIndex, maxDistance),
            ]);
            if (forwardResult.kind === StepResultKind.Break || backwardResult.kind === StepResultKind.Break) {
                // failed to find a path
                return [];
            }
            if (forwardResult.kind === StepResultKind.NodeHandled) {
                if (this.backwardCosts[forwardResult.nodeId] < Infinity) {
                    // shortest path has been found
                    // note that it doesn't necessarily contain the handled node
                    return this.constructPath(forwardResult.nodeId);
                }
            }
            if (backwardResult.kind === StepResultKind.NodeHandled) {
                if (this.forwardCosts[backwardResult.nodeId] < Infinity) {
                    return this.constructPath(backwardResult.nodeId);
                }
            }
        }
        // no path found
        return [];
    }
    constructPath(toIndex) {
        let currentPosition = toIndex;
        const forwardSteps = [];
        const backwardSteps = [];
        // reconstruct forward part of the path
        while (this.backwardParents[currentPosition] !== undefined) {
            let nextEdge;
            let nextPositionCost = Infinity;
            let way;
            for (const edge of this.graph.getAdjacencyList()[currentPosition]) {
                if (this.getBackwardCost(edge.node) < nextPositionCost) {
                    nextPositionCost = this.getBackwardCost(edge.node);
                    nextEdge = edge;
                    way = edge.through;
                }
            }
            if (!nextEdge) {
                break;
            }
            backwardSteps.push({
                from: this.graph.getLabel(currentPosition),
                to: this.graph.getLabel(nextEdge.node),
                through: way,
                distance: nextEdge.distance,
                duration: nextEdge.duration,
            });
            currentPosition = nextEdge.node;
        }
        currentPosition = toIndex;
        while (this.forwardParents[currentPosition] !== undefined) {
            let nextEdge;
            let nextPositionCost = Infinity;
            let way;
            for (const edge of this.graph.getReverseAdjacencyList()[currentPosition]) {
                if (this.getForwardCost(edge.node) < nextPositionCost) {
                    nextPositionCost = this.getForwardCost(edge.node);
                    nextEdge = edge;
                    way = edge.through;
                }
            }
            if (!nextEdge) {
                break;
            }
            forwardSteps.push({
                from: this.graph.getLabel(nextEdge.node),
                to: this.graph.getLabel(currentPosition),
                through: way,
                distance: nextEdge.distance,
                duration: nextEdge.duration,
            });
            currentPosition = nextEdge.node;
        }
        return forwardSteps.reverse().concat(backwardSteps);
    }
    async forwardStep(queue, toIndex, maxDistance) {
        if (!queue.length) {
            return { kind: StepResultKind.Break };
        }
        const { duration, distance, cost, position } = queue.pop();
        if (distance > maxDistance) {
            // avoid hopeless searches
            return { kind: StepResultKind.Break };
        }
        if (position === toIndex) {
            // it is done, break the loop and start reconstructing the path
            return { kind: StepResultKind.Break };
        }
        if (cost > this.getForwardCost(position)) {
            // we have already found a better way
            return { kind: StepResultKind.Continue };
        }
        if (this.graph.getBreakPoint(position)) {
            await this.graph.getBreakPoint(position)(this.graph.getLabel(position));
        }
        for (const edge of this.graph.getAdjacencyList()[position]) {
            const next = {
                distance: distance + edge.distance,
                duration: duration + edge.duration,
                cost: cost + edge.cost,
                position: edge.node,
            };
            if (next.cost < this.getForwardCost(next.position)) {
                this.setForwardCost(next.position, next.cost);
                this.forwardParents[next.position] = position;
                queue.push(next);
            }
        }
        return {
            kind: StepResultKind.NodeHandled,
            nodeId: position,
        };
    }
    async backwardStep(queue, toIndex, maxDistance) {
        if (!queue.length) {
            return { kind: StepResultKind.Break };
        }
        const { duration, distance, cost, position } = queue.pop();
        if (distance > maxDistance) {
            // avoid hopeless searches
            return { kind: StepResultKind.Break };
        }
        if (position === toIndex) {
            // it is done, break the loop and start reconstructing the path
            return { kind: StepResultKind.Break };
        }
        if (cost > this.getBackwardCost(position)) {
            // we have already found a better way
            return { kind: StepResultKind.Continue };
        }
        if (this.graph.getBreakPoint(position)) {
            await this.graph.getBreakPoint(position)(this.graph.getLabel(position));
        }
        for (const edge of this.graph.getReverseAdjacencyList()[position]) {
            const next = {
                distance: distance + edge.distance,
                duration: duration + edge.duration,
                cost: cost + edge.cost,
                position: edge.node,
            };
            if (next.cost < this.getBackwardCost(next.position)) {
                this.setBackwardCost(next.position, next.cost);
                this.backwardParents[next.position] = position;
                queue.push(next);
            }
        }
        return {
            kind: StepResultKind.NodeHandled,
            nodeId: position,
        };
    }
    setForwardCost(position, cost) {
        if (position >= this.forwardCosts.length) {
            const missingCosts = this.graph.getAdjacencyList().length - this.forwardCosts.length;
            this.forwardCosts = this.forwardCosts.concat([...Array(missingCosts)].fill(Infinity));
            this.forwardParents = this.forwardParents.concat([...Array(missingCosts)].fill(undefined));
        }
        this.forwardCosts[position] = cost;
    }
    getForwardCost(position) {
        if (position >= this.forwardCosts.length) {
            const missingCosts = this.graph.getAdjacencyList().length - this.forwardCosts.length;
            this.forwardCosts = this.forwardCosts.concat([...Array(missingCosts)].fill(Infinity));
            this.forwardParents = this.forwardParents.concat([...Array(missingCosts)].fill(undefined));
        }
        return this.forwardCosts[position];
    }
    setBackwardCost(position, cost) {
        if (position >= this.backwardCosts.length) {
            const missingCosts = this.graph.getAdjacencyList().length - this.backwardCosts.length;
            this.backwardCosts = this.backwardCosts.concat([...Array(missingCosts)].fill(Infinity));
            this.backwardParents = this.backwardParents.concat([...Array(missingCosts)].fill(undefined));
        }
        this.backwardCosts[position] = cost;
    }
    getBackwardCost(position) {
        if (position >= this.backwardCosts.length) {
            const missingCosts = this.graph.getAdjacencyList().length - this.backwardCosts.length;
            this.backwardCosts = this.backwardCosts.concat([...Array(missingCosts)].fill(Infinity));
            this.backwardParents = this.backwardParents.concat([...Array(missingCosts)].fill(undefined));
        }
        return this.backwardCosts[position];
    }
};
BidirDijkstraInstance = __decorate([
    inversify_1.injectable(),
    __metadata("design:paramtypes", [graph_1.default])
], BidirDijkstraInstance);
exports.BidirDijkstraInstance = BidirDijkstraInstance;
//# sourceMappingURL=BidirDijkstraInstance.js.map