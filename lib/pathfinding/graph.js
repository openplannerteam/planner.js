"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PathfindingGraph {
    constructor(id) {
        this.nodes = new Map();
        this.labels = [];
        this.adjacencyList = [];
        this.reverseAdjacencyList = [];
        this.id = id;
        this.breakPoints = {};
    }
    addEdge(from, to, through, distance, duration, cost) {
        const fromIndex = this.getNodeIndex(from);
        const toIndex = this.getNodeIndex(to);
        this.adjacencyList[fromIndex].push({ node: toIndex, through, distance, cost, duration });
        this.reverseAdjacencyList[toIndex].push({ node: fromIndex, through, distance, cost, duration });
    }
    getNodeMap() {
        return this.nodes;
    }
    getLabel(position) {
        return this.labels[position];
    }
    getAdjacencyList() {
        return this.adjacencyList;
    }
    getReverseAdjacencyList() {
        return this.reverseAdjacencyList;
    }
    getNodeIndex(label) {
        if (!this.nodes.has(label)) {
            const index = this.adjacencyList.length;
            this.nodes.set(label, index);
            this.labels.push(label);
            this.adjacencyList.push([]);
            this.reverseAdjacencyList.push([]);
        }
        return this.nodes.get(label);
    }
    setBreakPoint(on, callback) {
        const position = this.getNodeIndex(on);
        this.breakPoints[position] = callback;
    }
    getBreakPoint(position) {
        return this.breakPoints[position];
    }
    removeBreakPoint(on) {
        const position = this.getNodeIndex(on);
        delete this.breakPoints[position];
    }
}
exports.default = PathfindingGraph;
//# sourceMappingURL=graph.js.map