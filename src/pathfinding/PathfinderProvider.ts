import proj4 from "proj4";

import { inject, injectable } from "inversify";
import Profile from "../entities/profile/Profile";
import { RoutableTile } from "../entities/tiles/RoutableTile";
import { IRoutableTileNodeIndex, RoutableTileNode } from "../entities/tiles/RoutableTileNode";
import RoutableTileRegistry from "../entities/tiles/RoutableTileRegistry";
import { IRoutableTileWayIndex, RoutableTileWay } from "../entities/tiles/RoutableTileWay";
import ProfileProvider from "../fetcher/profiles/ProfileProviderDefault";
import ILocation from "../interfaces/ILocation";
import ILocationResolver from "../query-runner/ILocationResolver";
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
  segA: ILocation; // one side of the road segment closest to the point
  segB: ILocation; // other side of the road segment closest to the point
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
  private locationResolver: ILocationResolver;

  private embedded: Set<string>;
  private embeddings: IPointEmbedding[];

  constructor(
    @inject(TYPES.ShortestPathTreeAlgorithm) shortestPathTree: IShortestPathTreeAlgorithm,
    @inject(TYPES.ShortestPathAlgorithm) pointToPoint: IShortestPathAlgorithm,
    @inject(TYPES.ProfileProvider) profileProvider: ProfileProvider,
    @inject(TYPES.LocationResolver) locationResolver: ILocationResolver,
  ) {
    this.locationResolver = locationResolver;
    this.shortestPath = pointToPoint;
    this.shortestPathTree = shortestPathTree;
    this.routableTileRegistry = RoutableTileRegistry.getInstance();
    this.profileProvider = profileProvider;
    this.graphs = {};
    this.embeddings = [];
    this.embedded = new Set();
  }

  public getShortestPathAlgorithm(profile: Profile): IShortestPathInstance {
    const graph = this.getGraphForProfile(profile);
    return this.shortestPath.createInstance(graph, this.locationResolver);
  }

  public getShortestPathTreeAlgorithm(profile: Profile): IShortestPathTreeInstance {
    const graph = this.getGraphForProfile(profile);
    return this.shortestPathTree.createInstance(graph);
  }

  public async registerEdges(ways: Set<string>): Promise<void> {
    // add new edges to existing graphs
    for (const profileId of Object.keys(this.graphs)) {
      const profile = await this.profileProvider.getProfile(profileId);

      for (const wayId of ways) {
        const way = this.routableTileRegistry.getWay(wayId);
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
      if (this.embedded.has(profile.getID() + Geo.getId(p))) {
        continue;
      }

      this.embedded.add(profile.getID() + Geo.getId(p));

      let bestDistance = Infinity;
      let bestSegment: [RoutableTileWay, ILocation, ILocation];

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

            const distance = this.segmentDistToPoint(from, to, p);
            if (distance < bestDistance) {
              bestDistance = distance;
              bestSegment = [way, from, to];
            }
          }
        }
      }

      if (bestSegment) {
        const [way, segA, segB] = bestSegment;
        const intersection = this.projectOntoSegment(segA, segB, p);
        const newEmbedding: IPointEmbedding = {
          way, segA, segB, intersection, point: p,
        };

        for (const otherEmbedding of this.embeddings) {
          if (Geo.getId(otherEmbedding.segA) === Geo.getId(segA)
            && Geo.getId(otherEmbedding.segB) === Geo.getId(segB)) {
            this.addEdge(profile, intersection, otherEmbedding.intersection, way);
            this.addEdge(profile, otherEmbedding.intersection, intersection, way);
          }
        }

        this.embeddings.push(newEmbedding);

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
    // make sure we never have 0 costs, this confuses dijkstra
    distance = distance || profile.getDistance(from, to, way) || 0.01;
    const duration = profile.getDuration(from, to, way) || 1;
    const cost = profile.getCost(from, to, way) || 1;
    graph.addEdge(Geo.getId(from), Geo.getId(to), way.id, distance, duration, cost);
  }

  private segmentDistToPoint(segA: ILocation, segB: ILocation, p: ILocation): number {
    // potential 'catastrophic cancellation'
    const sx1 = segA.longitude;
    const sx2 = segB.longitude;
    const px = p.longitude;

    const sy1 = segA.latitude;
    const sy2 = segB.latitude;
    const py = p.latitude;

    const px2 = sx2 - sx1;  // <-
    const py2 = sy2 - sy1;  // <-

    const norm = px2 * px2 + py2 * py2;

    let u;
    if (norm) {
      u = ((px - sx1) * px2 + (py - sy1) * py2) / norm;
    } else {
      u = Infinity;
    }

    if (u > 1) {
      u = 1;
    } else if (u < 0) {
      u = 0;
    }

    const x = sx1 + u * px2;
    const y = sy1 + u * py2;

    const result = {
      longitude: x,
      latitude: y,
    };

    const dist = Geo.getDistanceBetweenLocations(p, result);
    return dist;
  }

  private projectOntoSegment(segA: ILocation, segB: ILocation, p: ILocation): ILocation {
    // potential 'catastrophic cancellation'
    const mSegA = proj4("EPSG:4326", "EPSG:3857", [segA.longitude, segA.latitude]);
    const mSegB = proj4("EPSG:4326", "EPSG:3857", [segB.longitude, segB.latitude]);
    const mP = proj4("EPSG:4326", "EPSG:3857", [p.longitude, p.latitude]);

    const sx1 = mSegA[0];
    const sx2 = mSegB[0];
    const px = mP[0];

    const sy1 = mSegA[1];
    const sy2 = mSegB[1];
    const py = mP[1];

    const px2 = sx2 - sx1;  // <-
    const py2 = sy2 - sy1;  // <-

    const norm = px2 * px2 + py2 * py2;

    let u;
    if (norm) {
      u = ((px - sx1) * px2 + (py - sy1) * py2) / norm;
    } else {
      u = Infinity;
    }

    if (u > 1) {
      u = 1;
    } else if (u < 0) {
      u = 0;
    }

    const x = sx1 + u * px2;
    const y = sy1 + u * py2;

    const intersection = proj4("EPSG:3857", "EPSG:4326", [x, y]);
    const result = {
      longitude: intersection[0],
      latitude: intersection[1],
    };

    return result;
  }
}
