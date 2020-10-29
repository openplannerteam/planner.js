import ILocation from "../../interfaces/ILocation";
import GeometryValue from "../tree/geometry";
import ZoiSubject from "./ZoiSubject";
export declare class ZoiZone {
    id: string;
    private boundary;
    private subject;
    private degree?;
    constructor(id: string, boundary: GeometryValue, subject: ZoiSubject, degree?: number);
    getBoundary(): GeometryValue;
    getSubject(): ZoiSubject;
    getDegree(): number;
    contains(location: ILocation): boolean;
}
