"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const jsonld = require("jsonld");
const ldfetch_1 = __importDefault(require("ldfetch"));
const CharacteresticProfile_1 = __importDefault(require("../../entities/profile/CharacteresticProfile"));
const ProfileConclusion_1 = __importDefault(require("../../entities/profile/ProfileConclusion"));
const ProfileCondition_1 = __importDefault(require("../../entities/profile/ProfileCondition"));
const ProfileRule_1 = __importDefault(require("../../entities/profile/ProfileRule"));
const ldloader_1 = require("../../loader/ldloader");
const single_1 = require("../../loader/views/single");
const types_1 = __importDefault(require("../../types"));
const constants_1 = require("../../uri/constants");
const uri_1 = __importDefault(require("../../uri/uri"));
let ProfileFetcherDefault = class ProfileFetcherDefault {
    constructor(ldFetch) {
        this.ldFetch = ldFetch;
        this.ldLoader = new ldloader_1.LDLoader();
        // unordered collections
        this.ldLoader.defineCollection(uri_1.default.inNS(constants_1.PROFILE, "hasAccessRules"));
        this.ldLoader.defineCollection(uri_1.default.inNS(constants_1.PROFILE, "hasOnewayRules"));
        this.ldLoader.defineCollection(uri_1.default.inNS(constants_1.PROFILE, "hasSpeedRules"));
        this.ldLoader.defineCollection(uri_1.default.inNS(constants_1.PROFILE, "hasPriorityRules"));
        this.ldLoader.defineCollection(uri_1.default.inNS(constants_1.PROFILE, "hasObstacleRules"));
        this.ldLoader.defineCollection(uri_1.default.inNS(constants_1.PROFILE, "hasObstacleTimeRules"));
        this.ldLoader.defineCollection(uri_1.default.inNS(constants_1.PROFILE, "hasProximityRules"));
    }
    async parseProfileBlob(blob, id) {
        const triples = await jsonld.toRDF(blob);
        const [profile] = this.ldLoader.process(triples, [
            this.getView(),
        ]);
        profile.id = id;
        return profile;
    }
    async get(url) {
        const rdfThing = await this.ldFetch.get(url);
        const triples = rdfThing.triples;
        const [profile] = this.ldLoader.process(triples, [
            this.getView(),
        ]);
        profile.id = url;
        return profile;
    }
    getView() {
        const view = new single_1.ThingView(CharacteresticProfile_1.default.create);
        view.addFilter((entity) => entity[uri_1.default.inNS(constants_1.PROFILE, "hasAccessRules")] !== undefined ||
            entity[uri_1.default.inNS(constants_1.PROFILE, "hasOnewayRules")] !== undefined ||
            entity[uri_1.default.inNS(constants_1.PROFILE, "hasSpeedRules")] !== undefined ||
            entity[uri_1.default.inNS(constants_1.PROFILE, "hasPriorityRules")] !== undefined ||
            entity[uri_1.default.inNS(constants_1.PROFILE, "hasObstacleRules")] !== undefined ||
            entity[uri_1.default.inNS(constants_1.PROFILE, "hasObstacleTimeRules")] !== undefined);
        view.addMapping(uri_1.default.inNS(constants_1.PROFILE, "hasAccessRules"), "accessRules", this.getRuleView());
        view.addMapping(uri_1.default.inNS(constants_1.PROFILE, "hasOnewayRules"), "onewayRules", this.getRuleView());
        view.addMapping(uri_1.default.inNS(constants_1.PROFILE, "hasSpeedRules"), "speedRules", this.getRuleView());
        view.addMapping(uri_1.default.inNS(constants_1.PROFILE, "hasPriorityRules"), "priorityRules", this.getRuleView());
        view.addMapping(uri_1.default.inNS(constants_1.PROFILE, "hasObstacleRules"), "obstacleRules", this.getRuleView());
        view.addMapping(uri_1.default.inNS(constants_1.PROFILE, "hasObstacleTimeRules"), "obstacleTimeRules", this.getRuleView());
        view.addMapping(uri_1.default.inNS(constants_1.PROFILE, "hasProximityRules"), "proximityRules", this.getRuleView());
        view.addMapping(uri_1.default.inNS(constants_1.PROFILE, "hasMaxSpeed"), "maxSpeed");
        view.addMapping(uri_1.default.inNS(constants_1.PROFILE, "usePublicTransport"), "usePublicTransport");
        return view;
    }
    getRuleView() {
        const view = new single_1.ThingView(ProfileRule_1.default.create);
        view.addFilter((entity) => entity[uri_1.default.inNS(constants_1.PROFILE, "concludes")] !== undefined);
        view.addMapping(uri_1.default.inNS(constants_1.PROFILE, "concludes"), "conclusion", this.getConclusionView());
        view.addMapping(uri_1.default.inNS(constants_1.PROFILE, "match"), "condition", this.getConditionView());
        view.addMapping(uri_1.default.inNS(constants_1.PROFILE, "hasOrder"), "order");
        return view;
    }
    getConditionView() {
        const view = new single_1.ThingView(ProfileCondition_1.default.create);
        view.addFilter((entity) => entity[uri_1.default.inNS(constants_1.PROFILE, "hasPredicate")] !== undefined ||
            entity[uri_1.default.inNS(constants_1.PROFILE, "hasObject")] !== undefined);
        view.addMapping(uri_1.default.inNS(constants_1.PROFILE, "hasPredicate"), "predicate");
        view.addMapping(uri_1.default.inNS(constants_1.PROFILE, "hasObject"), "object");
        return view;
    }
    getConclusionView() {
        const view = new single_1.ThingView(ProfileConclusion_1.default.create);
        view.addFilter((entity) => (entity[uri_1.default.inNS(constants_1.PROFILE, "hasAccess")] !== undefined) ||
            (entity[uri_1.default.inNS(constants_1.PROFILE, "isOneway")] !== undefined) ||
            (entity[uri_1.default.inNS(constants_1.PROFILE, "isReversed")] !== undefined) ||
            (entity[uri_1.default.inNS(constants_1.PROFILE, "hasSpeed")] !== undefined) ||
            (entity[uri_1.default.inNS(constants_1.PROFILE, "isObstacle")] !== undefined) ||
            (entity[uri_1.default.inNS(constants_1.PROFILE, "hasPriority")] !== undefined) ||
            (entity[uri_1.default.inNS(constants_1.PROFILE, "hasObstacleTime")] !== undefined));
        view.addMapping(uri_1.default.inNS(constants_1.PROFILE, "hasAccess"), "hasAccess");
        view.addMapping(uri_1.default.inNS(constants_1.PROFILE, "isOneway"), "isOneway");
        view.addMapping(uri_1.default.inNS(constants_1.PROFILE, "isReversed"), "isReversed");
        view.addMapping(uri_1.default.inNS(constants_1.PROFILE, "hasSpeed"), "speed");
        view.addMapping(uri_1.default.inNS(constants_1.PROFILE, "isObstacle"), "isObstacle");
        view.addMapping(uri_1.default.inNS(constants_1.PROFILE, "hasPriority"), "priority");
        view.addMapping(uri_1.default.inNS(constants_1.PROFILE, "hasObstacleTime"), "obstacleTime");
        return view;
    }
};
ProfileFetcherDefault = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.LDFetch)),
    __metadata("design:paramtypes", [typeof (_a = typeof ldfetch_1.default !== "undefined" && ldfetch_1.default) === "function" ? _a : Object])
], ProfileFetcherDefault);
exports.default = ProfileFetcherDefault;
//# sourceMappingURL=ProfileFetcherDefault.js.map