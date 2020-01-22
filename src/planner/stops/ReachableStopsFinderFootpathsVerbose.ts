import { inject, injectable } from "inversify";
import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import EventBus from "../../events/EventBus";
import EventType from "../../events/EventType";
import IFootpathsProvider from "../../fetcher/footpaths/IFootpathsProvider";
import IStop from "../../fetcher/stops/IStop";
import IStopsProvider from "../../fetcher/stops/IStopsProvider";
import { DurationMs, SpeedKmH } from "../../interfaces/units";
import TYPES from "../../types";
import { IReachableStop } from "./IReachableStopsFinder";
import ReachableStopsFinderFootpaths from "./ReachableStopsFinderFootpaths";

@injectable()
export default class ReachableStopsFinderFootpathsVerbose extends ReachableStopsFinderFootpaths {
  private done: Set<string>;

  constructor(
    @inject(TYPES.StopsProvider) stopsProvider: IStopsProvider,
    @inject(TYPES.FootpathsProvider) footpathsProvider: IFootpathsProvider,
  ) {
    super(stopsProvider, footpathsProvider);
    this.done = new Set();
  }

  public async findReachableStops(
    sourceOrTargetStop: IStop,
    mode: ReachableStopsFinderMode,
    maximumDuration: DurationMs,
    minimumSpeed: SpeedKmH,
  ): Promise<IReachableStop[]> {
    const result = await super.findReachableStops(sourceOrTargetStop, mode, maximumDuration, minimumSpeed);

    if (!this.done.has(sourceOrTargetStop.id)) {
      this.done.add(sourceOrTargetStop.id);
      for (const reachableStop of result) {
        EventBus.getInstance().emit(EventType.ReachableTransfer,
          {
            from: sourceOrTargetStop,
            to: reachableStop.stop,
          });
      }
    }

    return result;
  }
}
