"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EventType;
(function (EventType) {
    EventType["Query"] = "query";
    EventType["SubQuery"] = "sub-query";
    EventType["AbortQuery"] = "abort-query";
    EventType["InvalidQuery"] = "invalid-query";
    EventType["Warning"] = "warning";
    EventType["ConnectionPrefetch"] = "connection-prefetch";
    EventType["ConnectionIteratorView"] = "connection-iterator-view";
    EventType["ConnectionScan"] = "connection-scan";
    EventType["FinalReachableStops"] = "final-reachable-stops";
    EventType["InitialReachableStops"] = "initial-reachable-stops";
    EventType["AddedNewTransferProfile"] = "added-new-transfer-profile";
    EventType["ReachableLocation"] = "ReachableLocation";
    EventType["ReachableID"] = "ReachableID";
    EventType["ReachableTile"] = "ReachableTile";
    EventType["ReachableTransfer"] = "ReachableTransfer";
    EventType["ResourceFetch"] = "ResourceFetch";
    EventType["ZoiZone"] = "ZoiZone";
})(EventType || (EventType = {}));
exports.default = EventType;
//# sourceMappingURL=EventType.js.map