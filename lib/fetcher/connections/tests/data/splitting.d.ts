import DropOffType from "../../../../enums/DropOffType";
import PickupType from "../../../../enums/PickupType";
import TravelMode from "../../../../enums/TravelMode";
declare const connections: ({
    value: {
        "id": string;
        "travelMode": TravelMode;
        "departureStop": string;
        "arrivalStop": string;
        "departureTime": Date;
        "arrivalTime": Date;
        "tripId": string;
        "nextConnection": string[];
        "gtfs:pickupType": PickupType;
        "gtfs:dropOffType": DropOffType;
    };
    done: boolean;
} | {
    value: {
        "id": string;
        "travelMode": TravelMode;
        "departureStop": string;
        "arrivalStop": string;
        "departureTime": Date;
        "arrivalTime": Date;
        "tripId": string;
        "gtfs:pickupType": PickupType;
        "gtfs:dropOffType": DropOffType;
        "nextConnection"?: undefined;
    };
    done: boolean;
})[];
export default connections;
