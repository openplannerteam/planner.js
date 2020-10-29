"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UnionFind {
    constructor(size) {
        this.connections = [...Array(size).keys()];
        this.ranks = [...Array(size).keys()];
    }
    union(x, y) {
        let xRoot = this.find(x);
        let yRoot = this.find(y);
        if (xRoot === yRoot) {
            return;
        }
        if (this.ranks[xRoot] < this.ranks[yRoot]) {
            [xRoot, yRoot] = [yRoot, xRoot];
        }
        this.connections[yRoot] = xRoot;
        if (this.ranks[xRoot] === this.ranks[yRoot]) {
            this.ranks[xRoot] += 1;
        }
    }
    find(val) {
        if (this.connections[val] !== val) {
            this.connections[val] = this.find(this.connections[val]);
        }
        return this.connections[val];
    }
    getClusters() {
        const result = {};
        for (const [index, connection] of this.connections.entries()) {
            if (index === connection) {
                result[index] = new Set();
            }
        }
        for (const index of this.connections.keys()) {
            const cluster = this.find(index);
            result[cluster].add(index);
        }
        return result;
    }
}
exports.default = UnionFind;
//# sourceMappingURL=UnionFind.js.map