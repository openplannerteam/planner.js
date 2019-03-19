import { inject, injectable } from "inversify";
import LDFetch from "ldfetch";
import { Triple } from "rdf-js";
import TYPES from "../../../types";
import Rdf from "../../../util/Rdf";
import IRoutableTilesFetcher from "../IRoutableTilesFetcher";
import IRoutableTilesNode from "../IRoutableTilesNode";
import IRoutableTilesWay from "../IRoutableTilesWay";

interface IEntityMap {
  [id: string]: object;
}

interface INodeMap {
  [nodeId: string]: IRoutableTilesNode;
}

interface IWayMap {
  [wayId: string]: IRoutableTilesWay;
}

@injectable()
export default class RoutableTileFetcherLDFetch implements IRoutableTilesFetcher {
  /*
  TODO: Currently assumes tiles won't change
    Should be fine for simple client-side route planners
    Not ideal to build a service around
  */

  private accessUrl: string;

  private ldFetch: LDFetch;
  private loadPromise: Promise<any>;
  private nodes: INodeMap;
  private ways: IWayMap;

  constructor(
    @inject(TYPES.LDFetch) ldFetch: LDFetch,
  ) {
    this.ldFetch = ldFetch;
  }

  public setAccessUrl(accessUrl: string) {
    this.accessUrl = accessUrl;
  }

  public prefetchTiles(): void {
    this.ensureTilesLoaded();
  }

  public async getNodeById(stopId: string): Promise<IRoutableTilesNode> {
    await this.ensureTilesLoaded();

    return this.nodes[stopId];
  }

  public async getAllNodes(): Promise<IRoutableTilesNode[]> {
    await this.ensureTilesLoaded();

    return Object.values(this.nodes);
  }

  public async getWayById(wayId: string): Promise<IRoutableTilesWay> {
    await this.ensureTilesLoaded();

    return this.ways[wayId];
  }

  public async getAllWays(): Promise<IRoutableTilesWay[]> {
    await this.ensureTilesLoaded();

    return Object.values(this.ways);
  }

  private async ensureTilesLoaded() {
    if (!this.loadPromise && !this.nodes) {
      this.loadTiles();
    }

    if (this.loadPromise) {
      await this.loadPromise;
    }
  }

  private loadTiles() {
    if (this.accessUrl) {

      this.loadPromise = this.ldFetch
        .get(this.accessUrl)
        .then((response) => {
          const entities = this.parseTriples(response.triples);
          this.nodes = this.filterNodesFromEntities(entities);
          const ways = this.filterWaysFromEntities(entities);
          this._assembleNodeLists(entities, ways);
          this.ways = ways;
          this.loadPromise = null;
        })
        .catch((reason) => {
          console.log(reason);
        });
    }
  }

  private _assembleNodeLists(entities, ways) {
    const nodesPredicate = "nodes";
    const firstPredicate = "http://www.w3.org/1999/02/22-rdf-syntax-ns#first";
    const restPredicate = "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest";

    for (const way of Object.values(ways)) {
      const nodeList = [];
      let current = entities[way[nodesPredicate]];
      while (current && current[firstPredicate]) {
        nodeList.push(current[firstPredicate]);
        current = entities[current[restPredicate]];
      }
      way[nodesPredicate] = nodeList;
    }
  }

  private filterWaysFromEntities(entities: IEntityMap): IWayMap {
    const typePredicate = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
    const wayTypeValue = "https://w3id.org/openstreetmap/terms#Way";

    return Object.values(entities)
      .filter((entity) => entity[typePredicate] && entity[typePredicate] === wayTypeValue)
      .reduce((obj, entity) => {
        const way: IRoutableTilesWay = entity as IRoutableTilesWay;
        obj[way.id] = way;
        return obj;
      }, {}) as IWayMap;
  }

  private filterNodesFromEntities(entities: IEntityMap): INodeMap {
    const latitudePredicate = "latitude";
    const longitudePredicate = "longitude";

    return Object.values(entities)
      .filter((entity) => entity[latitudePredicate] && entity[longitudePredicate])
      .reduce((obj, entity) => {
        const node: IRoutableTilesNode = entity as IRoutableTilesNode;
        obj[node.id] = node;
        return obj;
      }, {}) as INodeMap;
  }

  private transformPredicate(triple: Triple): Triple {
    return Rdf.transformPredicate({
      "http://www.w3.org/2003/01/geo/wgs84_pos#lat": "latitude",
      "http://www.w3.org/2003/01/geo/wgs84_pos#long": "longitude",
      "https://w3id.org/openstreetmap/terms#nodes": "nodes",
    }, triple);
  }

  private parseTriples(triples: Triple[]): IEntityMap {
    const transformedTriples = triples.map((triple) => this.transformPredicate(triple));

    return transformedTriples.reduce((entityMap: IEntityMap, triple: Triple) => {
      const { subject: { value: subject }, predicate: { value: predicate }, object: { value: object } } = triple;

      if (!(subject in entityMap)) {
        entityMap[subject] = {
          id: subject,
        };
      }

      if (predicate === "longitude" || predicate === "latitude") {
        entityMap[subject][predicate] = parseFloat(object);

      } else {
        entityMap[subject][predicate] = object;
      }

      return entityMap;
    }, {});
  }
}
