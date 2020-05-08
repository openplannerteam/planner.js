import { RoutableTile } from "../../entities/tiles/tile";

export default interface IRoutableTileFetcher {
    get(url: string): Promise<RoutableTile>;
    getMetaData(url: string): Promise<RoutableTile>;
}
