"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Signifies different phases at which reachable stops can be searched for
 * Classes that use [[IReachableStopsFinder]] implementations can use these to tag different dependencies
 * This is especially useful when the class could potentially use different implementations of
 * the same [[IReachableStopsFinder]] interface at each phase
 */
var ReachableStopsSearchPhase;
(function (ReachableStopsSearchPhase) {
    ReachableStopsSearchPhase["Initial"] = "reachableStopsSearchInitial";
    ReachableStopsSearchPhase["Transfer"] = "reachableStopsSearchTransfer";
    ReachableStopsSearchPhase["Final"] = "reachableStopsSearchFinal";
})(ReachableStopsSearchPhase || (ReachableStopsSearchPhase = {}));
exports.default = ReachableStopsSearchPhase;
//# sourceMappingURL=ReachableStopsSearchPhase.js.map