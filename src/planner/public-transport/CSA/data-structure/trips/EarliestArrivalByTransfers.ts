import IConnection from "../../../../../fetcher/connections/IConnection";
import IArrivalTimeByTransfers from "../IArrivalTimeByTransfers";
import IEarliestArrival from "./IEarliestArrival";
import IEarliestArrivalByTransfers from "./IEarliestArrivalByTransfers";

/**
 * A factory that create's an [[IEarliestArrival]] for each amount of maximum transfers that can be made.
 *
 * @implements [[IEarliestArrivalByTransfers]]
 */
export default class EarliestArrivalByTransfers extends Array<IEarliestArrival> implements IEarliestArrivalByTransfers {
  public static create(amountOfTransfers: number): EarliestArrivalByTransfers {
    return new EarliestArrivalByTransfers(amountOfTransfers);
  }

  public static createByConnection(
    currentArrivalTimeByTransfers: EarliestArrivalByTransfers,
    connection: IConnection,
    arrivalTimeByTransfers: IArrivalTimeByTransfers,
  ): EarliestArrivalByTransfers {
    return currentArrivalTimeByTransfers.map((earliestArrival: IEarliestArrival, transfer: number) => {
      if (arrivalTimeByTransfers[transfer] < earliestArrival.arrivalTime) {
        return {
          connection,
          arrivalTime: arrivalTimeByTransfers[transfer],
        };
      }

      return earliestArrival;
    });
  }

  [amountOfTransfers: number]: IEarliestArrival;

  constructor(maximumTransfers: number) {
    super();

    for (let amountOfTransfers = 0 ; amountOfTransfers < maximumTransfers ; amountOfTransfers++) {
      this[amountOfTransfers] = {
        arrivalTime: Infinity,
        connection: undefined,
      };
    }
  }
}
