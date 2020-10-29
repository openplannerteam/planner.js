"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class URI {
    static inNS(ns, id) {
        // this probably misses a lot of special cases
        // but it'll do for now
        const lastChar = ns[ns.length - 1];
        if (lastChar === "/") {
            return `${ns}${id}`;
        }
        else if (lastChar === "#") {
            return `${ns}${id}`;
        }
        else {
            return `${ns}#${id}`;
        }
    }
    static fakeExpand(ns, id) {
        // discards the prefix and places it the specified NS
        return this.inNS(ns, id.substring(4));
    }
}
exports.default = URI;
//# sourceMappingURL=uri.js.map