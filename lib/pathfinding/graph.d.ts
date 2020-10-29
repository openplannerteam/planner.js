interface IEdge {
    node: number;
    distance: number;
    duration: number;
    cost: number;
    through: string;
}
export default class PathfindingGraph {
    private id;
    private nodes;
    private labels;
    private adjacencyList;
    private reverseAdjacencyList;
    private breakPoints;
    constructor(id: string);
    addEdge(from: string, to: string, through: string, distance: number, duration: number, cost: number): void;
    getNodeMap(): Map<string, number>;
    getLabel(position: number): string;
    getAdjacencyList(): IEdge[][];
    getReverseAdjacencyList(): IEdge[][];
    getNodeIndex(label: string): number;
    setBreakPoint(on: string, callback: (on: string) => Promise<void>): void;
    getBreakPoint(position: number): (on: string) => Promise<void>;
    removeBreakPoint(on: string): void;
}
export {};
