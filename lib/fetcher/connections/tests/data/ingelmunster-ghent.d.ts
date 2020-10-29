import TravelMode from "../../../../enums/TravelMode";
declare const connections: {
    value: {
        arrivalDelay: number;
        travelMode: TravelMode;
        departureDelay: number;
        id: string;
        arrivalStop: string;
        arrivalTime: Date;
        departureStop: string;
        departureTime: Date;
        tripId: string;
    };
    done: boolean;
}[];
export default connections;
