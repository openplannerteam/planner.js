/**
 * Helper class for vectors.
 */
export default class Vectors {
    static shiftVector<T extends any[]>(vector: T, item: any): T;
    static minVector<T extends any[]>(keyExtractor: (component: any) => number, ...vectors: T[]): T;
}
