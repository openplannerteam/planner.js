import IRoutableTilesNode from "./IRoutableTilesNode";
import IRoutableTilesWay from "./IRoutableTilesWay";

export default interface IRoutableTilesProvider {
  prefetchTiles: () => void;
  getNodeById: (nodeId: string) => Promise<IRoutableTilesNode>;
  getAllNodes: () => Promise<IRoutableTilesNode[]>;
  getWayById: (wayId: string) => Promise<IRoutableTilesWay>;
  getAllWays: () => Promise<IRoutableTilesWay[]>;
}
