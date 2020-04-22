import { TransitTile } from "../../entities/tiles/tile";

export default interface ITransitTileFetcher {
    get(url: string): Promise<TransitTile>;
}
