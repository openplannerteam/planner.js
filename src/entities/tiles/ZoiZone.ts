import ILocation from "../../interfaces/ILocation";
import GeometryValue from "../tree/geometry";
import ZoiSubject from "./ZoiSubject";

export class ZoiZone {
    public id: string;
    private boundary: GeometryValue;
    private subject: ZoiSubject;
    private degree?: number;

    constructor(id: string, boundary: GeometryValue, subject: ZoiSubject, degree = 1) {
        this.id = id;
        this.boundary = boundary;
        this.subject = subject;
        this.degree = degree;
    }

    public getBoundary() {
        return this.boundary;
    }

    public getSubject() {
        return this.subject;
    }

    public getDegree() {
        return this.degree;
    }

    public contains(location: ILocation): boolean {
        return this.boundary.contains(location);
    }
}
