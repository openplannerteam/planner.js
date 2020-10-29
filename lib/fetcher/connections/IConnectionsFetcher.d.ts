import { LinkedConnectionsPage } from "../../entities/connections/page";
import TravelMode from "../../enums/TravelMode";
export default interface IConnectionsFetcher {
    get(url: string): Promise<LinkedConnectionsPage>;
    setTravelMode(travelMode: TravelMode): void;
}
