export interface IPathfinder {
    addEdge(from: string, to: string, weight: number): void;
    queryDistance(from: string, to: string): number;
}
