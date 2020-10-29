"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ZoiZone {
    constructor(id, boundary, subject, degree = 1) {
        this.id = id;
        this.boundary = boundary;
        this.subject = subject;
        this.degree = degree;
    }
    getBoundary() {
        return this.boundary;
    }
    getSubject() {
        return this.subject;
    }
    getDegree() {
        return this.degree;
    }
    contains(location) {
        return this.boundary.contains(location);
    }
}
exports.ZoiZone = ZoiZone;
//# sourceMappingURL=ZoiZone.js.map