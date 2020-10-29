"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Units_1 = __importDefault(require("./util/Units"));
/**
 * This class holds the default [[IQuery]]/[[IResolvedQuery]] parameters
 */
class Defaults {
}
exports.default = Defaults;
Defaults.defaultMinimumWalkingSpeed = 3;
Defaults.defaultMaximumWalkingSpeed = 6;
Defaults.defaultWalkingDuration = Units_1.default.fromMinutes(10);
Defaults.defaultMinimumTransferDuration = Units_1.default.fromMinutes(1);
Defaults.defaultMaximumTransferDuration = Units_1.default.fromMinutes(25);
Defaults.defaultMaximumTransfers = 4;
//# sourceMappingURL=Defaults.js.map