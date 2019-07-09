import { OSM } from "../uri/constants";
import URI from "../uri/uri";

export default function getOsmTagMapping() {
    const result = {};

    result[URI.inNS(OSM, "access")] = "accessRestrictions";
    result[URI.inNS(OSM, "bicycle")] = "bicycleAccessRestrictions";
    result[URI.inNS(OSM, "construction")] = "constructionKind";
    result[URI.inNS(OSM, "crossing")] = "crossingKind";
    result[URI.inNS(OSM, "cycleway")] = "cyclewayKind";
    result[URI.inNS(OSM, "footway")] = "footwayKind";
    result[URI.inNS(OSM, "highway")] = "highwayKind";
    result[URI.inNS(OSM, "maxspeed")] = "maxSpeed";
    result[URI.inNS(OSM, "motor_vehicle")] = "motorVehicleAccessRestrictions";
    result[URI.inNS(OSM, "motorcar")] = "motorcarAccessRestrictions";
    result[URI.inNS(OSM, "oneway_bicycle")] = "onewayBicycleKind";
    result[URI.inNS(OSM, "oneway")] = "onewayKind";
    result[URI.inNS(OSM, "smoothness")] = "smoothnessKind";
    result[URI.inNS(OSM, "surface")] = "surfaceKind";
    result[URI.inNS(OSM, "tracktype")] = "trackType";
    result[URI.inNS(OSM, "vehicle")] = "vehicleAccessRestrictions";

    return result;
}
