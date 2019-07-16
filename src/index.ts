import "isomorphic-fetch";
import "reflect-metadata";

import IsochroneGenerator from "./analytics/isochrones/main";
import Planner from "./Planner";

/*
async function dostuff() {
    const x = new IsochroneGenerator({ latitude: 51.03863, longitude: 3.72634 });
    x.setProfileID("PEDESTRIAN");
    let a = await x.getIsochrone(50000, true);
    a = await x.getIsochrone(150000, false);
    x.setProfileID("http://hdelva.be/profile/car");
    a = await x.getIsochrone(150000, true);
}

dostuff().then(() => {
    let a = 9;
})
*/

export default {
    Planner,
    IsochroneGenerator,
};
