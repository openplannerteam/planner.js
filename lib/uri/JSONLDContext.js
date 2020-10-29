"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uri_1 = __importDefault(require("./uri"));
class JSONLDContext {
    constructor(blob) {
        this.rawData = {};
        this.aliases = {};
        if (Array.isArray(blob)) {
            this.processArray(blob);
        }
        else {
            this.rawData = blob;
            this.processObject(blob);
        }
    }
    resolveIdentifier(name) {
        if (name.indexOf("://") > 0) {
            // absolute URI
            return name;
        }
        if (this.aliases[name]) {
            return this.aliases[name];
        }
        if (name.indexOf(":") > 0) {
            this.aliases[name] = this.expandURI(name);
            return this.aliases[name];
        }
        return name;
    }
    processObject(blob) {
        for (const [name, data] of Object.entries(blob)) {
            if (name.indexOf(":") >= 0) {
                this.aliases[name] = this.expandURI(name);
            }
            if (typeof (data) === "object") {
                if (data["@id"]) {
                    const rawId = data["@id"];
                    this.aliases[name] = this.expandURI(rawId);
                }
            }
            else if (typeof (data) === "string") {
                this.aliases[name] = this.expandURI(data);
            }
        }
    }
    expandURI(name) {
        if (name.indexOf("://") > 0) {
            // absolute URI
            return name;
        }
        if (name.indexOf(":") < 0) {
            return name;
        }
        const [prefix, rest] = name.split(":");
        const namespace = this.rawData[prefix];
        if (namespace) {
            return uri_1.default.inNS(namespace, rest);
        }
        else {
            return name;
        }
    }
    processArray(blobs) {
        for (const blob of blobs) {
            this.rawData = Object.assign(this.rawData, blob);
            this.processObject(blob);
        }
    }
}
exports.default = JSONLDContext;
//# sourceMappingURL=JSONLDContext.js.map