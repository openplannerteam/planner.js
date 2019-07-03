interface IEdge {
    node: number;
    distance: number;
    duration: number;
    cost: number;
}

interface INodeMap {
    [label: string]: number;
}

export default class PathfindingGraph {
    private nodes: INodeMap;
    private labels: string[];
    private adjacencyList: IEdge[][];

    constructor() {
        this.nodes = {};
        this.labels = [];
        this.adjacencyList = [];
    }

    public addEdge(from: string, to: string, distance: number, duration: number, cost: number) {
        const fromIndex = this.getNodeIndex(from);
        const toIndex = this.getNodeIndex(to);
        this.adjacencyList[fromIndex].push({ node: toIndex, distance, cost, duration });
    }

    public getNodeMap() {
        return this.nodes;
    }

    public getLabel(position: number) {
        return this.labels[position];
    }

    public getAdjacencyList() {
        return this.adjacencyList;
    }

    public getNodeIndex(label: string) {
        if (!this.nodes[label]) {
            const index = this.adjacencyList.length;
            this.nodes[label] = index;
            this.labels.push(label);
            this.adjacencyList.push([]);
        }

        return this.nodes[label];
    }
}
