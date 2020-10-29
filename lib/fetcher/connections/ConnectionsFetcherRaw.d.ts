import { LinkedConnectionsPage } from "../../entities/connections/page";
import TravelMode from "../../enums/TravelMode";
import IConnectionsFetcher from "./IConnectionsFetcher";
export default class ConnectionsFetcherRaw implements IConnectionsFetcher {
    protected travelMode: TravelMode;
    setTravelMode(travelMode: TravelMode): void;
    get(url: string): Promise<LinkedConnectionsPage>;
    private parseResponseLength;
}
