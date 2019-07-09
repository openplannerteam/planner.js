import "isomorphic-fetch";
import "reflect-metadata";
import IsochroneGenerator from "./analytics/isochrones/main";
import Planner from "./Planner";

/*
import defaultContainer from "./inversify.config";
import Context from "./Context";
import TYPES from "./types";
import IProfileFetcher from "./fetcher/profiles/IProfileFetcher";

const x = new IsochroneGenerator();
x.init({latitude: 51.0262973, longitude: 3.7110885}).then(async () => {
    const i = await x.getIsochrone(10000);
    let y = 9;
})
*/

export default {
    Planner,
    IsochroneGenerator,
};
