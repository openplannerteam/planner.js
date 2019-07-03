export default class UnionFind {
  private ranks: number[];
  private connections: number[];

  constructor(size: number) {
    this.connections = [...Array(size).keys()];
    this.ranks = [...Array(size).keys()];
  }

  public union(x: number, y: number) {
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

  public find(val: number) {
    if (this.connections[val] !== val) {
      this.connections[val] = this.find(this.connections[val]);
    }

    return this.connections[val];
  }

  public getClusters() {
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
