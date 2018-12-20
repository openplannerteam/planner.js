import IConnection from "../../../../fetcher/connections/IConnection";
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
    maxLegs,
    minimumTransferDuration,
  ): IArrivalTimeByTransfers {
    const { arrivalStop, arrivalTime } = connection;
    const trip = connection["gtfs:trip"];

    if (connection["gtfs:dropOffType"] !== "gtfs:NotAvailable") {

      let i = profilesByStop[arrivalStop].length - 1;
      while (i >= 0) {
        if (profilesByStop[arrivalStop][i].departureTime >= arrivalTime.getTime() + minimumTransferDuration) {
          const arrivalTimeByTransfers = profilesByStop[arrivalStop][i].getArrivalTimeByTransfers(trip);
          return arrivalTimeByTransfers.slice() as IArrivalTimeByTransfers;
        }
        i--;
      }

    }

    return Array(maxLegs + 1).fill({
      "arrivalTime": Infinity,
      "gtfs:trip": connection["gtfs:trip"],
    });
  }
}
