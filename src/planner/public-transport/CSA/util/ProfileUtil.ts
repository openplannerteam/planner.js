import DropOffType from "../../../../fetcher/connections/DropOffType";
import IConnection from "../../../../fetcher/connections/IConnection";
import { DurationMs } from "../../../../interfaces/units";
import IArrivalTimeByTransfers from "../data-structure/IArrivalTimeByTransfers";
import IProfilesByStop from "../data-structure/stops/IProfilesByStop";

/**
 * Utility functions that can be used on the CSA profiles [[IProfilesByStop]].
 */
export default class ProfileUtil {

  public static filterInfinity(profilesByStop: IProfilesByStop): IProfilesByStop {
    const result = {};

    for (const stop in profilesByStop) {
      if (profilesByStop.hasOwnProperty(stop)) {
        result[stop] = profilesByStop[stop].filter((profile) =>
          profile.departureTime !== Infinity,
        );
      }
    }
    return result;
  }

  public static getTransferTimes(
    profilesByStop: IProfilesByStop,
    connection: IConnection,
    maxLegs: number,
    minimumTransferDuration: DurationMs,
    maximumTransferDuration: DurationMs,
  ): IArrivalTimeByTransfers {
    const { arrivalStop, arrivalTime } = connection;
    const trip = connection["gtfs:trip"];

    if (connection["gtfs:dropOffType"] !== DropOffType.NotAvailable) {

      let profileIndex = profilesByStop[arrivalStop].length - 1;
      while (profileIndex >= 0) {

        const departure: number = profilesByStop[arrivalStop][profileIndex].departureTime;
        const arrival: number = arrivalTime.getTime();

        const transferDuration = departure - arrival;

        if (transferDuration >= minimumTransferDuration && transferDuration <= maximumTransferDuration) {
          const arrivalTimeByTransfers = profilesByStop[arrivalStop][profileIndex].getArrivalTimeByTransfers(trip);
          return arrivalTimeByTransfers.slice() as IArrivalTimeByTransfers;
        }
        profileIndex--;
      }

    }

    return Array(maxLegs + 1).fill({
      "arrivalTime": Infinity,
      "gtfs:trip": connection["gtfs:trip"],
    });
  }
}
