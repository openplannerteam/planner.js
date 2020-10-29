"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const results_1 = require("../results");
const single_1 = require("./single");
class IndexThingView extends single_1.ThingView {
    createResultObject() {
        return new results_1.IndexThingViewResult();
    }
}
exports.IndexThingView = IndexThingView;
//# sourceMappingURL=index.js.map