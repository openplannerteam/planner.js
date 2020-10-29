"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const demo_1 = __importDefault(require("./demo"));
const isDebugging = process && process.argv.includes("--debug");
(async () => {
    if (isDebugging) { // tslint:disable-next-line:no-debugger
        debugger;
    }
    demo_1.default(true)
        .then((success) => console.log(success ? "Success" : "Fail"))
        .catch((e) => console.error(e));
})();
//# sourceMappingURL=demo.cli.js.map