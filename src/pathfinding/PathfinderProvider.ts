import { inject, injectable } from "inversify";
import { IRoutableTileNodeIndex, RoutableTileNode } from "../entities/tiles/node";
import RoutableTileRegistry from "../entities/tiles/registry";
import { RoutableTileSet } from "../entities/tiles/set";
import { IRoutableTileWayIndex } from "../entities/tiles/way";
import ILocation from "../interfaces/ILocation";
import TYPES from "../types";
import Geo from "../util/Geo";
import { IShortestPathAlgorithm, IShortestPathTreeAlgorithm } from "./pathfinder";

interface IPointEmbedding {
  point: ILocation; // point that's embedded into the road network
  intersection: ILocation; // closest point on the road segment closest to the point
  segA: RoutableTileNode; // one side of the road segment closest to the point
  segB: RoutableTileNode; // other side of the road segment closest to the point
}

@injectable()
export default class PathfinderProvider {
  private shortestPath: IShortestPathAlgorithm;
  private shortestPathTree: IShortestPathTreeAlgorithm;
  private routableTileRegistry: RoutableTileRegistry;

  constructor(
    @inject(TYPES.ShortestPathTreeAlgorithm) shortestPathTree: IShortestPathTreeAlgorithm,
    @inject(TYPES.ShortestPathAlgorithm) pointToPoint: IShortestPathAlgorithm,
    @inject(TYPES.RoutableTileRegistry) routableTileRegistry: RoutableTileRegistry,
  ) {
    this.shortestPath = pointToPoint;
    this.shortestPathTree = shortestPathTree;
    this.routableTileRegistry = routableTileRegistry;
  }

  public getShortestPathAlgorithm(): IShortestPathAlgorithm {
    return this.shortestPath;
  }

  public getShortestPathTreeAlgorithm(): IShortestPathTreeAlgorithm {
    return this.shortestPathTree;
  }

  public registerEdges(ways: IRoutableTileWayIndex, nodes: IRoutableTileNodeIndex): void {
    for (const way of Object.values(ways)) {
      for (const segment of way.segments) {
        for (let i = 0; i < segment.length - 1; i++) {
          const from = nodes[segment[i]];
          const to = nodes[segment[i + 1]];
          if (from && to) {
            // todo, profiles here
            const distance = Geo.getDistanceBetweenLocations(from, to);
            this.addEdge(from.id, to.id, distance);
            this.addEdge(to.id, from.id, distance);
          }
        }
      }
    }
  }

  public embedLocation(p: ILocation, tileset: RoutableTileSet, invert = false) {
    let bestDistance = Infinity;
    let bestEmbedding: IPointEmbedding;

    for (const wayId of tileset.getWays()) {
      const way = this.routableTileRegistry.getWay(wayId);

      if (way.reachable === false) {
        continue;
      }

      for (const segment of way.segments) {
        for (let i = 0; i < segment.length - 1; i++) {
          const nodeA = segment[i];
          const from = this.routableTileRegistry.getNode(nodeA);
          const nodeB = segment[i + 1];
          const to = this.routableTileRegistry.getNode(nodeB);

          if (!from || !to) {
            // FIXME, caused by bug in data
            continue;
          }

          const [distance, intersection] = this.segmentDistToPoint(from, to, p);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestEmbedding = {
              point: p,
              segA: from,
              segB: to,
              intersection,
            };
          }
        }
      }
    }

    if (bestEmbedding) {
      const intersection = bestEmbedding.intersection;
      const segA = bestEmbedding.segA;
      const segB = bestEmbedding.segB;

      const pointId = Geo.getId(bestEmbedding.point);
      const intersectionId = Geo.getId(bestEmbedding.intersection);

      if (!invert) {
        // todo, account for one-direction streets
        this.addEdge(pointId, intersectionId, bestDistance);
        this.addEdge(intersectionId, segA.id, Geo.getDistanceBetweenLocations(intersection, segA));
        this.addEdge(intersectionId, segB.id, Geo.getDistanceBetweenLocations(intersection, segB));
      } else {
        this.addEdge(intersectionId, pointId, bestDistance);
        this.addEdge(segA.id, intersectionId, Geo.getDistanceBetweenLocations(intersection, segA));
        this.addEdge(segB.id, intersectionId, Geo.getDistanceBetweenLocations(intersection, segB));
      }
    }
  }

  private addEdge(from: string, to: string, cost) {
    if (this.getShortestPathAlgorithm()) {
      this.shortestPath.addEdge(from, to, cost);
    }

    if (this.getShortestPathTreeAlgorithm()) {
      this.shortestPathTree.addEdge(from, to, cost);
    }
  }

  private segmentDistToPoint(segA: ILocation, segB: ILocation, p: ILocation): [number, ILocation] {
    // seems numerically unstable, see 'catastrophic cancellation'
    const sx1 = segA.longitude;
    const sx2 = segB.longitude;
    const px = p.longitude;

    const sy1 = segA.latitude;
    const sy2 = segB.latitude;
    const py = p.latitude;

    const px2 = sx2 - sx1;
    const py2 = sy2 - sy2;

    const norm = px2 * px2 + py2 * py2;
    let u = ((px - sx1) * px2 + (py - sy1) * py2) / norm;

    if (u > 1) {
      u = 1;
    } else if (u < 0) {
      u = 0;
    }

    const x = sx1 + u * px2;
    const y = sy1 + u * py2;

    const intersection = {
      longitude: x,
      latitude: y,
    };

    const dist = Geo.getDistanceBetweenLocations(p, intersection);

    return [dist, intersection];
  }
}
