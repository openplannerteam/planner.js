import Planner from ".";

const point = { latitude: 51.0262973, longitude: 3.7110885 };
const x = new Planner.IsochroneGenerator();
x.init(point).then(async () => {
    await x.getIsochrone(2500, true);
});
