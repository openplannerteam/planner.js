interface IEdge {
    node: number;
    distance: number;
    duration: number;
    cost: number;
    through: string;
}

interface INodeMap {
    [label: string]: number;
}

interface IBreakPointIndex {
    [position: number]: (on: string) => Promise<void>;
}

export default class PathfindingGraph {
    private id: string;
    private nodes: Map<string, number>;
    private labels: string[];
    private adjacencyList: IEdge[][];
    private reverseAdjacencyList: IEdge[][];
    private breakPoints: IBreakPointIndex;

    constructor(id: string) {
        this.nodes = new Map();
        this.labels = [];
        this.adjacencyList = [];
        this.reverseAdjacencyList = [];
        this.id = id;
        this.breakPoints = {};
    }

    public addEdge(from: string, to: string, through: string, distance: number, duration: number, cost: number) {
        const fromIndex = this.getNodeIndex(from);
        const toIndex = this.getNodeIndex(to);
        this.adjacencyList[fromIndex].push({ node: toIndex, through, distance, cost, duration });
        this.reverseAdjacencyList[toIndex].push({ node: fromIndex, through, distance, cost, duration });
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

    public getReverseAdjacencyList() {
        return this.reverseAdjacencyList;
    }

    public getNodeIndex(label: string) {
        if (!this.nodes.has(label)) {
            const index = this.adjacencyList.length;
            this.nodes.set(label, index);
            this.labels.push(label);
            this.adjacencyList.push([]);
            this.reverseAdjacencyList.push([]);
        }

        return this.nodes.get(label);
    }

    public setBreakPoint(on: string, callback: (on: string) => Promise<void>): void {
        const position = this.getNodeIndex(on);
        this.breakPoints[position] = callback;
    }

    public getBreakPoint(position: number): (on: string) => Promise<void> {
        return this.breakPoints[position];
    }

    public removeBreakPoint(on: string): void {
        const position = this.getNodeIndex(on);
        delete this.breakPoints[position];
    }
}
