"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const LDFetch_1 = __importDefault(require("../fetcher/LDFetch"));
const constants_1 = require("../uri/constants");
const uri_1 = __importDefault(require("../uri/uri"));
const Datatypes_1 = __importDefault(require("./Datatypes"));
async function classifyDataSource(accessUrl) {
    let datatype;
    if (accessUrl.indexOf("tiles") >= 0) {
        if (accessUrl.indexOf("hdelva.be/") >= 0) {
            datatype = Datatypes_1.default.ReducedRoutableTile;
        }
        else {
            datatype = Datatypes_1.default.RoutableTile;
        }
    }
    else if (accessUrl.indexOf("hdelva.be/stops/distances/") >= 0) {
        datatype = Datatypes_1.default.Footpath;
    }
    else {
        const fetcher = new LDFetch_1.default();
        const response = await fetcher.get(accessUrl);
        const triples = response.triples;
        const usedPredicates = new Set();
        for (const t of triples) {
            const { predicate } = t;
            usedPredicates.add(predicate.value);
        }
        if (usedPredicates.has(uri_1.default.inNS(constants_1.LC, "departureStop"))) {
            datatype = Datatypes_1.default.Connections;
        }
        else if (usedPredicates.has(uri_1.default.inNS(constants_1.GEO, "lat"))) {
            datatype = Datatypes_1.default.Stops;
        }
        else if (usedPredicates.has(uri_1.default.inNS(constants_1.PROFILE, "hasAccessRules"))) {
            datatype = Datatypes_1.default.Profile;
        }
        else {
            datatype = Datatypes_1.default.Unknown;
        }
    }
    return {
        accessUrl,
        datatype,
    };
}
exports.default = classifyDataSource;
//# sourceMappingURL=classify.js.map