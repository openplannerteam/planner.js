import { ZoiTile } from "../../entities/tiles/ZoiTile";

export default interface IZoiTileFetcher {
    get(url: string): Promise<ZoiTile>;
}
