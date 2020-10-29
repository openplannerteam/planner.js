"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EventType_1 = __importDefault(require("../events/EventType"));
class InvalidQueryError extends Error {
    constructor() {
        super(...arguments);
        this.eventType = EventType_1.default.InvalidQuery;
    }
}
exports.default = InvalidQueryError;
//# sourceMappingURL=InvalidQueryError.js.map