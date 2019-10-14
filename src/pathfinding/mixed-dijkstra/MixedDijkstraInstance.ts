import { injectable } from "inversify";
import ILocationResolver from "../../query-runner/ILocationResolver";
import Geo from "../../util/Geo";
import { BidirDijkstraInstance } from "../bidirdijkstra/BidirDijkstraInstance";
import { DijkstraInstance } from "../dijkstra/DijkstraInstance";
import PathfindingGraph from "../graph";
import { IShortestPathInstance } from "../pathfinder";

@injectable()
export class MixedDijkstraInstance implements IShortestPathInstance {
    private bidir: BidirDijkstraInstance;
    private classic: DijkstraInstance;
    private locationResolver: ILocationResolver;

    constructor(graph: PathfindingGraph, locationResolver: ILocationResolver) {
        this.bidir = new BidirDijkstraInstance(graph);
        this.classic = new DijkstraInstance(graph);
        this.locationResolver = locationResolver;
    }

    public setUseWeightedCost(useWeightedCost: boolean) {
        this.bidir.setUseWeightedCost(useWeightedCost);
        this.classic.setUseWeightedCost(useWeightedCost);
    }

    public setBreakPoint(on: string, callback: (on: string) => Promise<void>): void {
        this.bidir.setBreakPoint(on, callback);
        this.classic.setBreakPoint(on, callback);
    }

    public removeBreakPoint(on: string): void {
        this.bidir.removeBreakPoint(on);
        this.classic.removeBreakPoint(on);
    }

    public async queryPath(from: string, to: string, maxDistance = Infinity) {
        const promises = [this.locationResolver.resolve(from), this.locationResolver.resolve(to)];
        const [fromLocation, toLocation] = await Promise.all(promises);
        const distance = Geo.getDistanceBetweenLocations(fromLocation, toLocation);

        if (distance < 1000) {
            return this.classic.queryPath(from, to, maxDistance);
        } else {
            return this.bidir.queryPath(from, to, maxDistance);
        }
    }
}
