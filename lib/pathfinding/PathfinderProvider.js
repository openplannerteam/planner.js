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
Object.defineProperty(exports, "__esModule", { value: true });
const proj4_1 = __importDefault(require("proj4"));
const inversify_1 = require("inversify");
const RoutableTileRegistry_1 = __importDefault(require("../entities/tiles/RoutableTileRegistry"));
const ProfileProviderDefault_1 = __importDefault(require("../fetcher/profiles/ProfileProviderDefault"));
const types_1 = __importDefault(require("../types"));
const Geo_1 = __importDefault(require("../util/Geo"));
const graph_1 = __importDefault(require("./graph"));
let PathfinderProvider = class PathfinderProvider {
    constructor(shortestPathTree, pointToPoint, profileProvider, locationResolver) {
        this.locationResolver = locationResolver;
        this.shortestPath = pointToPoint;
        this.shortestPathTree = shortestPathTree;
        this.routableTileRegistry = RoutableTileRegistry_1.default.getInstance();
        this.profileProvider = profileProvider;
        this.graphs = {};
        this.embeddings = [];
        this.embedded = new Set();
    }
    getShortestPathAlgorithm(profile) {
        const graph = this.getGraphForProfile(profile);
        return this.shortestPath.createInstance(graph, this.locationResolver);
    }
    getShortestPathTreeAlgorithm(profile) {
        const graph = this.getGraphForProfile(profile);
        return this.shortestPathTree.createInstance(graph);
    }
    async registerEdges(ways) {
        // add new edges to existing graphs
        for (const profileId of Object.keys(this.graphs)) {
            const profile = await this.profileProvider.getProfile(profileId);
            for (const wayId of ways) {
                const way = this.routableTileRegistry.getWay(wayId);
                if (!profile.hasAccess(way)) {
                    continue;
                }
                for (const edge of way.getParts()) {
                    const from = this.routableTileRegistry.getNode(edge.from);
                    const to = this.routableTileRegistry.getNode(edge.to);
                    if (from && to) {
                        if (profile.isObstacle(from) || profile.isObstacle(to)) {
                            continue;
                        }
                        this.addEdge(profile, from, to, way, edge.distance);
                        if (!profile.isOneWay(way)) {
                            this.addEdge(profile, to, from, way, edge.distance);
                        }
                    }
                }
            }
        }
    }
    async embedLocation(p, tileset, invert = false) {
        for (const profile of await this.profileProvider.getProfiles()) {
            if (this.embedded.has(profile.getID() + Geo_1.default.getId(p))) {
                continue;
            }
            this.embedded.add(profile.getID() + Geo_1.default.getId(p));
            let bestDistance = Infinity;
            let bestSegment;
            for (const wayId of tileset.getWays()) {
                const way = this.routableTileRegistry.getWay(wayId);
                if (!profile.hasAccess(way) || way.reachable === false) {
                    continue;
                }
                for (const segment of way.segments) {
                    for (let i = 0; i < segment.length - 1; i++) {
                        const nodeA = segment[i];
                        const from = this.routableTileRegistry.getNode(nodeA);
                        const nodeB = segment[i + 1];
                        const to = this.routableTileRegistry.getNode(nodeB);
                        if (!from || !to) {
                            // FIXME, caused by bug in data
                            continue;
                        }
                        const distance = this.segmentDistToPoint(from, to, p);
                        if (distance < bestDistance) {
                            bestDistance = distance;
                            bestSegment = [way, from, to];
                        }
                    }
                }
            }
            if (bestSegment) {
                const [way, segA, segB] = bestSegment;
                const intersection = this.projectOntoSegment(segA, segB, p);
                const newEmbedding = {
                    way, segA, segB, intersection, point: p,
                };
                for (const otherEmbedding of this.embeddings) {
                    if (Geo_1.default.getId(otherEmbedding.segA) === Geo_1.default.getId(segA)
                        && Geo_1.default.getId(otherEmbedding.segB) === Geo_1.default.getId(segB)) {
                        this.addEdge(profile, intersection, otherEmbedding.intersection, way);
                        this.addEdge(profile, otherEmbedding.intersection, intersection, way);
                    }
                }
                this.embeddings.push(newEmbedding);
                const isOneWay = profile.isOneWay(way);
                if (!invert) {
                    // A -------------------> B
                    // A <-- intersection --> B
                    //            |
                    //            p
                    this.addEdge(profile, p, intersection, way);
                    this.addEdge(profile, intersection, segB, way);
                    if (!isOneWay) {
                        this.addEdge(profile, intersection, segA, way);
                    }
                }
                else {
                    // A -------------------> B
                    // A --> intersection <-- B
                    //            |
                    //            p
                    this.addEdge(profile, intersection, p, way);
                    this.addEdge(profile, segA, intersection, way);
                    if (!isOneWay) {
                        this.addEdge(profile, segB, intersection, way);
                    }
                }
            }
        }
    }
    getGraphForProfile(profile) {
        if (!this.graphs[profile.getID()]) {
            // we don't have a graph for this profile yet
            // create one
            const graph = new graph_1.default(profile.getID());
            this.graphs[profile.getID()] = graph;
            // and populate it with all the data we have
            for (const way of this.routableTileRegistry.getWays()) {
                if (!profile.hasAccess(way)) {
                    continue;
                }
                for (const edge of way.getParts()) {
                    const from = this.routableTileRegistry.getNode(edge.from);
                    const to = this.routableTileRegistry.getNode(edge.to);
                    if (from && to) {
                        if (profile.isObstacle(from) || profile.isObstacle(to)) {
                            continue;
                        }
                        this.addEdge(profile, from, to, way, edge.distance, graph);
                        if (!profile.isOneWay(way)) {
                            this.addEdge(profile, to, from, way, edge.distance, graph);
                        }
                    }
                }
            }
        }
        return this.graphs[profile.getID()];
    }
    addEdge(profile, from, to, way, distance, graph) {
        // this specifically adds an edge that corresponds to an actual street
        // if you need to add any other edge, you'll need to create a different method
        graph = graph || this.getGraphForProfile(profile);
        // make sure we never have 0 costs, this confuses dijkstra
        distance = distance || profile.getDistance(from, to, way) || 0.01;
        const duration = profile.getDuration(from, to, way) || 1;
        const cost = profile.getCost(from, to, way) || 1;
        graph.addEdge(Geo_1.default.getId(from), Geo_1.default.getId(to), way.id, distance, duration, cost);
    }
    segmentDistToPoint(segA, segB, p) {
        // potential 'catastrophic cancellation'
        const sx1 = segA.longitude;
        const sx2 = segB.longitude;
        const px = p.longitude;
        const sy1 = segA.latitude;
        const sy2 = segB.latitude;
        const py = p.latitude;
        const px2 = sx2 - sx1; // <-
        const py2 = sy2 - sy1; // <-
        const norm = px2 * px2 + py2 * py2;
        let u;
        if (norm) {
            u = ((px - sx1) * px2 + (py - sy1) * py2) / norm;
        }
        else {
            u = Infinity;
        }
        if (u > 1) {
            u = 1;
        }
        else if (u < 0) {
            u = 0;
        }
        const x = sx1 + u * px2;
        const y = sy1 + u * py2;
        const result = {
            longitude: x,
            latitude: y,
        };
        const dist = Geo_1.default.getDistanceBetweenLocations(p, result);
        return dist;
    }
    projectOntoSegment(segA, segB, p) {
        // potential 'catastrophic cancellation'
        const mSegA = proj4_1.default("EPSG:4326", "EPSG:3857", [segA.longitude, segA.latitude]);
        const mSegB = proj4_1.default("EPSG:4326", "EPSG:3857", [segB.longitude, segB.latitude]);
        const mP = proj4_1.default("EPSG:4326", "EPSG:3857", [p.longitude, p.latitude]);
        const sx1 = mSegA[0];
        const sx2 = mSegB[0];
        const px = mP[0];
        const sy1 = mSegA[1];
        const sy2 = mSegB[1];
        const py = mP[1];
        const px2 = sx2 - sx1; // <-
        const py2 = sy2 - sy1; // <-
        const norm = px2 * px2 + py2 * py2;
        let u;
        if (norm) {
            u = ((px - sx1) * px2 + (py - sy1) * py2) / norm;
        }
        else {
            u = Infinity;
        }
        if (u > 1) {
            u = 1;
        }
        else if (u < 0) {
            u = 0;
        }
        const x = sx1 + u * px2;
        const y = sy1 + u * py2;
        const intersection = proj4_1.default("EPSG:3857", "EPSG:4326", [x, y]);
        const result = {
            longitude: intersection[0],
            latitude: intersection[1],
        };
        return result;
    }
};
PathfinderProvider = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.ShortestPathTreeAlgorithm)),
    __param(1, inversify_1.inject(types_1.default.ShortestPathAlgorithm)),
    __param(2, inversify_1.inject(types_1.default.ProfileProvider)),
    __param(3, inversify_1.inject(types_1.default.LocationResolver)),
    __metadata("design:paramtypes", [Object, Object, ProfileProviderDefault_1.default, Object])
], PathfinderProvider);
exports.default = PathfinderProvider;
//# sourceMappingURL=PathfinderProvider.js.map