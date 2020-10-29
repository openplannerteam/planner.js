"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ldfetch_1 = __importDefault(require("ldfetch"));
const Rdf_1 = __importDefault(require("../util/Rdf"));
const ldfetch = new ldfetch_1.default({ headers: { Accept: "application/ld+json" } });
// ldfetch.get("http://irail.be/stations/NMBS/008896008")
ldfetch.get("https://openplanner.ilabt.imec.be/delijn/Limburg/stops")
    .then((response) => {
    Rdf_1.default.logTripleTable(response.triples);
})
    .catch((reason) => {
    console.log(reason);
});
//# sourceMappingURL=test-ldfetch.js.map