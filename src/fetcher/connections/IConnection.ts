export default interface IConnection {
  id: string;

  arrivalTime: Date;
  arrivalStop: string;
  arrivalDelay: number;

  departureTime: Date;
  departureStop: string;
  departureDelay: number;

  "gtfs:trip": string;
}
