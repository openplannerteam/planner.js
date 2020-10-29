"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const d3_delaunay_1 = require("d3-delaunay");
const fs = require("fs");
require("isomorphic-fetch");
require("reflect-metadata");
const default_1 = __importDefault(require("../../configs/default"));
const types_1 = __importDefault(require("../../types"));
const Geo_1 = __importDefault(require("../../util/Geo"));
const Iterators_1 = __importDefault(require("../../util/Iterators"));
class FootpathGenerator {
    async generatePaths() {
        const stopsProvider = default_1.default.get(types_1.default.StopsProvider);
        const planner = default_1.default.get(types_1.default.RoadPlanner);
        const dict = await this.getPairs(stopsProvider);
        const locations = Object.keys(dict).sort((a, b) => a > b ? -1 : 1);
        let done = 0;
        for (const fromId of locations) {
            done += 1;
            let fileId = fromId.split("//")[1];
            fileId = fileId.replace(/\./g, "_");
            fileId = fileId.replace(/\//g, "_");
            const fileName = `distances/${fileId}.json`;
            if (fs.existsSync(fileName)) {
                continue;
            }
            if ((locations.length - done) % 10 === 0) {
                console.log("To do:", locations.length - done);
            }
            const footpathDistances = {};
            for (const toId of dict[fromId]) {
                try {
                    const [to, from] = await Promise.all([
                        stopsProvider.getStopById(fromId),
                        stopsProvider.getStopById(toId),
                    ]);
                    const query = {
                        profileID: "https://hdelva.be/profile/pedestrian",
                        from: [from],
                        to: [to],
                        minimumWalkingSpeed: 4.5,
                        maximumWalkingSpeed: 4.5,
                    };
                    const pathIterator = await planner.plan(query);
                    const distanceIterator = pathIterator.map((path) => path.legs.reduce((totalDistance, leg) => totalDistance + leg.getDistance(), 0));
                    const distances = await Iterators_1.default.toArray(distanceIterator);
                    if (distances.length) {
                        const shortest = Math.min(...distances);
                        if (shortest) {
                            footpathDistances[toId] = Math.round(shortest);
                        }
                    }
                }
                catch (err) {
                    throw err;
                    console.log(err);
                }
            }
            await fs.writeFile(fileName, JSON.stringify(footpathDistances), "utf-8", (err) => {
                if (err) {
                    throw err;
                }
            });
        }
    }
    async getPairs(stopsProvider) {
        const stops = await stopsProvider.getAllStops();
        // using the WGS84 coordinates as-is
        function getX(p) {
            return p.longitude;
        }
        function getY(p) {
            return p.latitude;
        }
        function nextHalfedge(e) {
            // from https://mapbox.github.io/delaunator/
            return (e % 3 === 2) ? e - 2 : e + 1;
        }
        const delaunay = d3_delaunay_1.Delaunay.from(stops, getX, getY);
        let pairs = [];
        for (let e = 0; e < delaunay.triangles.length; e++) {
            if (e > delaunay.halfedges[e]) {
                // this will create a single triangulation
                // extra checks can be added here to calculate edges between different operators
                const p = stops[delaunay.triangles[e]];
                const q = stops[delaunay.triangles[nextHalfedge(e)]];
                pairs.push([p, q]); // in both directions of course
                pairs.push([q, p]);
                // todo, replace with yielding dicts instead of pairs
            }
        }
        // because of practical reasons, shortest distances require less data
        pairs = pairs.sort((a, b) => Geo_1.default.getDistanceBetweenLocations(a[0], a[1]) -
            Geo_1.default.getDistanceBetweenLocations(b[0], b[1]));
        pairs = pairs.filter((edge) => Geo_1.default.getDistanceBetweenLocations(edge[0], edge[1]) < 5000);
        // pairs = pairs.sort((a, b) => a[0].longitude - b[0].longitude);
        const dict = {};
        for (const [first, second] of pairs) {
            if (first.id === "https://data.delijn.be/stops/201657") {
                if (!dict[first.id]) {
                    dict[first.id] = [];
                }
                dict[first.id].push(second.id);
            }
        }
        return dict;
    }
}
exports.default = FootpathGenerator;
//# sourceMappingURL=main.js.map