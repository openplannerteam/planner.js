import { AsyncIterator } from "asynciterator";
import fs = require("fs");
import "isomorphic-fetch";
import "reflect-metadata";
import Planner from "../../Planner";

export default Planner;

import IStopsProvider from "../../fetcher/stops/IStopsProvider";
import IPath from "../../interfaces/IPath";
import { DistanceM } from "../../interfaces/units";
import defaultContainer from "../../inversify.config";
import IRoadPlanner from "../../planner/road/IRoadPlanner";
import TYPES from "../../types";
import Geo from "../../util/Geo";
import Iterators from "../../util/Iterators";

async function loadPairs(stopsProvider) {
    const original = JSON.parse(fs.readFileSync("nmbs_pairs.json").toString());
    const resolved = [];
    for (const pair of original) {
        const from = await stopsProvider.getStopById(pair[0]);
        const to = await stopsProvider.getStopById(pair[1]);
        resolved.push([from, to]);
    }
    const bidirectional = resolved.map((p) => [[p[0], p[1]], [p[1], p[0]]]).flat();
    bidirectional.sort((a, b) => Geo.getDistanceBetweenLocations(a[0], a[1]) -
        Geo.getDistanceBetweenLocations(b[0], b[1]));
    return bidirectional;
}

async function doStuff() {
    const stopsProvider = defaultContainer.get<IStopsProvider>(TYPES.StopsProvider);
    const planner = defaultContainer.get<IRoadPlanner>(TYPES.RoadPlanner);

    const pairs = await loadPairs(stopsProvider);

    let done = 0;

    for (const pair of pairs) {
        done += 1;
        console.log("done", pairs.length - done);
        const [to, from] = pair;

        let allDistances = {};
        let fileId = to.split("//")[1];
        fileId = fileId.replace(/\./g, "_");
        fileId = fileId.replace(/\//g, "_");
        const fileName = `distances/${fileId}.json`;

        fs.readFile(fileName, (err, data) => {
            if (data && data.length) {
                allDistances = JSON.parse(data.toString());
            }
        });

        if (allDistances[to.id]) {
            continue;
        }
        try {
            const query = {
                from: [from],
                to: [to],
                minimumWalkingSpeed: 4.5,
                maximumWalkingSpeed: 4.5,
            };

            const pathIterator = await planner.plan(query);

            const distanceIterator: AsyncIterator<DistanceM> = pathIterator.map((path: IPath) =>
                path.steps.reduce((totalDistance: DistanceM, step) => totalDistance + step.distance, 0),
            );

            const distances = await Iterators.toArray(distanceIterator);
            if (distances.length) {
                const shortest = Math.min(...distances);

                allDistances[to.id] = shortest;

                await fs.writeFile(fileName, JSON.stringify(allDistances), "utf-8", (err) => {
                    if (err) {
                        throw err;
                    }

                    console.log("The file has been saved!");
                });

            }
        } catch (yes) {
            console.log(yes);
        }
    }
}

doStuff().then(() => {
    const x = 9;
});
