import DropOffType from "../../../../enums/DropOffType";
import PickupType from "../../../../enums/PickupType";
import TravelMode from "../../../../enums/TravelMode";

const connections = [
  {
    value: {
      "id": "2a",
      "travelMode": TravelMode.Train,
      "arrivalStop": "http://irail.be/stations/NMBS/008891702", // B
      "departureStop": "http://irail.be/stations/NMBS/008892007", // C
      "departureTime": new Date("2017-12-19T16:22:00.000Z"),
      "arrivalTime": new Date("2017-12-19T16:30:00.000Z"),
      "tripId": "A",
      "gtfs:pickupType": PickupType.Regular,
      "gtfs:dropOffType": DropOffType.Regular,
    },
    done: false,
  },
  {
    value: {
      "id": "2b",
      "travelMode": TravelMode.Train,
      "arrivalStop": "http://irail.be/stations/NMBS/008891702", // B
      "departureStop": "http://irail.be/stations/NMBS/008812005", // D
      "departureTime": new Date("2017-12-19T16:23:00.000Z"),
      "arrivalTime": new Date("2017-12-19T16:34:00.000Z"),
      "tripId": "B",
      "nextConnection": ["1"],
      "gtfs:pickupType": PickupType.Regular,
      "gtfs:dropOffType": DropOffType.Regular,
    },
    done: false,
  },
  {
    value: {
      "id": "1",
      "travelMode": TravelMode.Train,
      "arrivalStop": "http://irail.be/stations/NMBS/008821006", // A
      "departureStop": "http://irail.be/stations/NMBS/008891702", // B
      "departureTime": new Date("2017-12-19T16:35:00.000Z"),
      "arrivalTime": new Date("2017-12-19T16:50:00.000Z"),
      "tripId": "A",
      "gtfs:pickupType": PickupType.Regular,
      "gtfs:dropOffType": DropOffType.Regular,
    },
    done: false,
  },
];

export default connections;
