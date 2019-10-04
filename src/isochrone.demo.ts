import { IsochroneGenerator } from ".";

const x = new IsochroneGenerator({ latitude: 51.0262973, longitude: 3.7110885 });
x.enableDebugLogs();
x.getIsochrone(2500, true).then((y) => {
    console.log(y);
});
