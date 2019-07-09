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
import { IShortestPathAlgorithm, IShortestPathTreeAlgorithm } from "./pathfinder";

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
  }

  public getShortestPathAlgorithm(): IShortestPathAlgorithm {
    const profile = this.profileProvider.getActiveProfile();
    const graph = this.getGraphForProfile(profile);
    this.shortestPath.setGraph(graph);
    return this.shortestPath;
  }

  public getShortestPathTreeAlgorithm(): IShortestPathTreeAlgorithm {
    const profile = this.profileProvider.getActiveProfile();
    const graph = this.getGraphForProfile(profile);
    this.shortestPathTree.setGraph(graph);
    return this.shortestPathTree;
  }

  public async registerEdges(ways: IRoutableTileWayIndex, nodes: IRoutableTileNodeIndex): Promise<void> {
    // add new edges to existing graphs
    for (const profileId of Object.keys(this.graphs)) {
      const profile = await this.profileProvider.getProfile(profileId);

      for (const way of Object.values(ways)) {
        if (!profile.hasAccess(way)) {
          continue;
        }

        for (const [fromId, toId] of way.getParts()) {
          const from = nodes[fromId];
          const to = nodes[toId];
          if (from && to) {
            if (profile.isObstacle(from) || profile.isObstacle(to)) {
              continue;
            }
            this.addEdge(profile, from, to, way);
            if (!profile.isOneWay(way)) {
              this.addEdge(profile, to, from, way);
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

      if (bestEmbedding) {
        const intersection = bestEmbedding.intersection;
        const segA = bestEmbedding.segA;
        const segB = bestEmbedding.segB;
        const way = bestEmbedding.way;
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

  private getGraphForProfile(profile: Profile): PathfindingGraph {
    if (!this.graphs[profile.getID()]) {
      // we don't have a graph for this profile yet
      // create one
      const graph = new PathfindingGraph();
      this.graphs[profile.getID()] = graph;

      // and populate it with all the data we have
      for (const way of this.routableTileRegistry.getWays()) {
        if (!profile.hasAccess(way)) {
          continue;
        }

        for (const [fromId, toId] of way.getParts()) {
          const from = this.routableTileRegistry.getNode(fromId);
          const to = this.routableTileRegistry.getNode(toId);
          if (from && to) {
            if (profile.isObstacle(from) || profile.isObstacle(to)) {
              continue;
            }
            this.addEdge(profile, from, to, way, graph);
            if (!profile.isOneWay(way)) {
              this.addEdge(profile, to, from, way, graph);
            }
          }
        }
      }
    }
    return this.graphs[profile.getID()];
  }

  private addEdge(profile: Profile, from: ILocation, to: ILocation, way: RoutableTileWay, graph?: PathfindingGraph) {
    // this specifically adds an edge that corresponds to an actual street
    // if you need to add any other edge, you'll need to create a different method
    graph = graph || this.getGraphForProfile(profile);
    const distance = profile.getDistance(from, to, way);
    const duration = profile.getDuration(from, to, way);
    const cost = profile.getCost(from, to, way);
    graph.addEdge(Geo.getId(from), Geo.getId(to), distance, duration, cost);
  }

  private segmentDistToPoint(segA: ILocation, segB: ILocation, p: ILocation): [number, ILocation] {
    // seems numerically unstable, see 'catastrophic cancellation'
    const sx1 = segA.longitude;
    const sx2 = segB.longitude;
    const px = p.longitude;

    const sy1 = segA.latitude;
    const sy2 = segB.latitude;
    const py = p.latitude;

    const px2 = sx2 - sx1;  // <-
    const py2 = sy2 - sy2;  // <-

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
