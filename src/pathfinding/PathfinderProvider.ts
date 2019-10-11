import Big from "big.js";
import proj4 from "proj4";

import { inject, injectable } from "inversify";
import Profile from "../entities/profile/Profile";
import { IRoutableTileNodeIndex, RoutableTileNode } from "../entities/tiles/node";
import RoutableTileRegistry from "../entities/tiles/registry";
import { RoutableTile } from "../entities/tiles/tile";
import { IRoutableTileWayIndex, RoutableTileWay } from "../entities/tiles/way";
import ProfileProvider from "../fetcher/profiles/ProfileProviderDefault";
import ILocation from "../interfaces/ILocation";
import TYPES from "../types";
import Geo from "../util/Geo";
import PathfindingGraph from "./graph";
import {
  IShortestPathAlgorithm,
  IShortestPathInstance,
  IShortestPathTreeAlgorithm,
  IShortestPathTreeInstance,
} from "./pathfinder";

interface IPointEmbedding {
  way: RoutableTileWay; // the road where the point gets embedded in
  point: ILocation; // point that's embedded into the road network
  intersection: ILocation; // closest point on the road segment closest to the point
  segA: RoutableTileNode; // one side of the road segment closest to the point
  segB: RoutableTileNode; // other side of the road segment closest to the point
}

interface IGraphMap {
  [label: string]: PathfindingGraph;
}

@injectable()
export default class PathfinderProvider {
  private graphs: IGraphMap;

  private shortestPath: IShortestPathAlgorithm;
  private shortestPathTree: IShortestPathTreeAlgorithm;
  private routableTileRegistry: RoutableTileRegistry;
  private profileProvider: ProfileProvider;

  private embeddings: IPointEmbedding[];

  constructor(
    @inject(TYPES.ShortestPathTreeAlgorithm) shortestPathTree: IShortestPathTreeAlgorithm,
    @inject(TYPES.ShortestPathAlgorithm) pointToPoint: IShortestPathAlgorithm,
    @inject(TYPES.RoutableTileRegistry) routableTileRegistry: RoutableTileRegistry,
    @inject(TYPES.ProfileProvider) profileProvider: ProfileProvider,
  ) {
    this.shortestPath = pointToPoint;
    this.shortestPathTree = shortestPathTree;
    this.routableTileRegistry = routableTileRegistry;
    this.profileProvider = profileProvider;
    this.graphs = {};
    this.embeddings = [];
  }

  public getShortestPathAlgorithm(profile: Profile): IShortestPathInstance {
    const graph = this.getGraphForProfile(profile);
    return this.shortestPath.createInstance(graph);
  }

  public getShortestPathTreeAlgorithm(profile: Profile): IShortestPathTreeInstance {
    const graph = this.getGraphForProfile(profile);
    return this.shortestPathTree.createInstance(graph);
  }

  public async registerEdges(ways: IRoutableTileWayIndex, nodes: IRoutableTileNodeIndex): Promise<void> {
    // add new edges to existing graphs
    for (const profileId of Object.keys(this.graphs)) {
      const profile = await this.profileProvider.getProfile(profileId);

      for (const way of Object.values(ways)) {
        if (!profile.hasAccess(way)) {
          continue;
        }

        for (const edge of way.getParts()) {
          const from = nodes[edge.from];
          const to = nodes[edge.to];
          if (from && to) {
            if (profile.isObstacle(from) || profile.isObstacle(to)) {
              continue;
            }
            this.addEdge(profile, from, to, way, edge.distance);
            if (!profile.isOneWay(way)) {
              this.addEdge(profile, to, from, way, edge.distance);
            }
          }
        }
      }
    }
  }

  public async embedLocation(p: ILocation, tileset: RoutableTile, invert = false) {
    for (const profile of await this.profileProvider.getProfiles()) {
      let bestDistance = Infinity;
      let bestEmbedding: IPointEmbedding;

      for (const wayId of tileset.getWays()) {
        const way = this.routableTileRegistry.getWay(wayId);

        if (!profile.hasAccess(way) || way.reachable === false) {
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

            const embedding = this.segmentDistToPoint(from, to, p);
            if (embedding) {
              const [distance, intersection] = this.segmentDistToPoint(from, to, p);
              if (distance < bestDistance) {
                bestDistance = distance;
                bestEmbedding = {
                  way,
                  point: p,
                  segA: from,
                  segB: to,
                  intersection,
                };
              }
            }
          }
        }
      }

      if (bestEmbedding) {
        const way = bestEmbedding.way;

        for (const otherEmbedding of this.embeddings) {
          if (otherEmbedding.segA === bestEmbedding.segA && otherEmbedding.segB === bestEmbedding.segB) {
            this.addEdge(profile, bestEmbedding.intersection, otherEmbedding.intersection, way);
            this.addEdge(profile, otherEmbedding.intersection, bestEmbedding.intersection, way);
          }
        }

        this.embeddings.push(bestEmbedding);

        const intersection = bestEmbedding.intersection;
        const segA = bestEmbedding.segA;
        const segB = bestEmbedding.segB;
        const isOneWay = profile.isOneWay(way);

        if (!invert) {
          // A -------------------> B
          // A <-- intersection --> B
          //            |
          //            p
          this.addEdge(profile, p, intersection, way);
          this.addEdge(profile, intersection, segB, way);
          if (!isOneWay) {
            this.addEdge(profile, intersection, segA, way);
          }
        } else {
          // A -------------------> B
          // A --> intersection <-- B
          //            |
          //            p
          this.addEdge(profile, intersection, p, way);
          this.addEdge(profile, segA, intersection, way);
          if (!isOneWay) {
            this.addEdge(profile, segB, intersection, way);
          }
        }
      }
    }
  }

  public getGraphForProfile(profile: Profile): PathfindingGraph {
    if (!this.graphs[profile.getID()]) {
      // we don't have a graph for this profile yet
      // create one
      const graph = new PathfindingGraph(profile.getID());
      this.graphs[profile.getID()] = graph;

      // and populate it with all the data we have
      for (const way of this.routableTileRegistry.getWays()) {
        if (!profile.hasAccess(way)) {
          continue;
        }

        for (const edge of way.getParts()) {
          const from = this.routableTileRegistry.getNode(edge.from);
          const to = this.routableTileRegistry.getNode(edge.to);
          if (from && to) {
            if (profile.isObstacle(from) || profile.isObstacle(to)) {
              continue;
            }
            this.addEdge(profile, from, to, way, edge.distance, graph);
            if (!profile.isOneWay(way)) {
              this.addEdge(profile, to, from, way, edge.distance, graph);
            }
          }
        }
      }
    }
    return this.graphs[profile.getID()];
  }

  private addEdge(
    profile: Profile,
    from: ILocation, to:
      ILocation,
    way: RoutableTileWay,
    distance?: number,
    graph?: PathfindingGraph,
  ) {
    // this specifically adds an edge that corresponds to an actual street
    // if you need to add any other edge, you'll need to create a different method
    graph = graph || this.getGraphForProfile(profile);
    distance = distance || profile.getDistance(from, to, way);
    const duration = profile.getDuration(from, to, way);
    const cost = profile.getCost(from, to, way);
    graph.addEdge(Geo.getId(from), Geo.getId(to), distance, duration, cost);
  }

  private segmentDistToPoint(segA: ILocation, segB: ILocation, p: ILocation): [number, ILocation] {
    // potential 'catastrophic cancellation', hence the Big library
    const mSegA = proj4("EPSG:4326", "EPSG:3857", [segA.longitude, segA.latitude]);
    const mSegB = proj4("EPSG:4326", "EPSG:3857", [segB.longitude, segB.latitude]);
    const mP = proj4("EPSG:4326", "EPSG:3857", [p.longitude, p.latitude]);

    const sx1 = Big(mSegA[0]);
    const sx2 = Big(mSegB[0]);
    const px = Big(mP[0]);

    const sy1 = Big(mSegA[1]);
    const sy2 = Big(mSegB[1]);
    const py = Big(mP[1]);

    const px2 = sx2.minus(sx1);  // <-
    const py2 = sy2.minus(sy1);  // <-

    const norm = px2.times(px2).plus(py2.times(py2));

    let u = px.minus(sx1).times(px2).plus(
      py.minus(sy1).times(py2),
    ).div(norm);

    if (u > 1) {
      u = Big(1);
    } else if (u < 0) {
      u = Big(0);
    }

    const x = sx1.plus(u.times(px2));
    const y = sy1.plus(u.times(py2));

    const mIntersection = [parseFloat(x), parseFloat(y)];
    const intersection = proj4("EPSG:3857", "EPSG:4326", mIntersection);
    const result = {
      longitude: intersection[0],
      latitude: intersection[1],
    };

    const dist = Geo.getDistanceBetweenLocations(p, result);
    return [dist, result];
  }
}
