import ILeg from "../interfaces/ILeg";
import IPath from "../interfaces/IPath";
import IQuery from "../interfaces/IQuery";
import { DurationMs } from "../interfaces/units";
/**
 * This Path class serves as an implementation of the [[IPath]] interface and as a home for some helper functions
 * related to [[IPath]] instances
 */
export default class Path implements IPath {
    static create(): Path;
    /**
     * Compare two [[IPath]] instances
     * @returns true if the two paths are the same
     */
    static compareEquals(path: IPath, otherPath: IPath): boolean;
    context: object;
    legs: ILeg[];
    constructor(legs: ILeg[], context?: object);
    updateContext(other: object): void;
    addToContext(id: string, value: any): void;
    getContext(): object;
    getFromContext(id: string): any;
    prependLeg(leg: ILeg): void;
    appendLeg(leg: ILeg): void;
    addPath(path: IPath): void;
    getStartLocationId(): string;
    getDepartureTime(query: IQuery): Date;
    getArrivalTime(query: IQuery): Date;
    getTravelTime(query: IQuery): DurationMs;
    getTransferTime(query: IQuery): DurationMs;
}
