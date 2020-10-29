import { RoutableTile } from "../../entities/tiles/RoutableTile";
export default interface IRoutableTileFetcher {
    get(url: string): Promise<RoutableTile>;
}
