import IConnection from "../../../fetcher/connections/IConnection";
import IProfilesByStop from "./data-structure/IProfilesByStop";
import IArrivalTimeByTransfers from "./data-structure/IArrivalTimeByTransfers";

/**
 * Shift a number vector to the right,
 * inserting Infinity on the left side and discarding
 * the last number on the right side
 * @param vector: [int]
 */

export function shiftVector(vector: IArrivalTimeByTransfers): IArrivalTimeByTransfers {
  vector.unshift(Infinity);
  vector.pop();
  return vector;
}

/**
 * Calculate component-wise minimum of an array of vectors
 * eg minVector([[3,8,9],[4,4,4],[5,5,1]]) = [3,4,1]
 * @param vectors: [[int]]
 * @returns {Array}
 */
export function minVector(...vectors: IArrivalTimeByTransfers[]): IArrivalTimeByTransfers {
  if (!vectors || !vectors[0]) {
    return [];
  }

  const result: IArrivalTimeByTransfers = vectors[0];
  for (let vectorIndex = 1 ; vectorIndex < vectors.length ; vectorIndex++) {
    for (let numberIndex = 0 ; numberIndex < vectors[vectorIndex].length ; numberIndex++) {
      if (vectors[vectorIndex][numberIndex] < result[numberIndex]) {
        result[numberIndex] = vectors[vectorIndex][numberIndex];
      }
    }
  }
  return result;
}

export function filterInfinity(profilesByStop: IProfilesByStop): IProfilesByStop {
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

export function evalProfile(profilesByStop: IProfilesByStop, connection: IConnection, maxLegs) {
  const {arrivalStop, arrivalTime} = connection;
  let i = profilesByStop[arrivalStop].length - 1;
  while (i >= 0) {
    if (profilesByStop[arrivalStop][i].departureTime >= arrivalTime.getTime()) {
      return profilesByStop[arrivalStop][i].arrivalTimes.slice(); // Return a copy of the array
    }
    i--;
  }
  return Array(maxLegs).fill(Infinity);
}
