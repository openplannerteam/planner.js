export default class UnionFind {
    private ranks;
    private connections;
    constructor(size: number);
    union(x: number, y: number): void;
    find(val: number): number;
    getClusters(): {};
}
