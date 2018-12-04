/**
 * Helper class for vectors.
 */
export default class Vectors {

  public static shiftVector<T extends any[]>(vector: T, item: any): T {
    vector.unshift(item);
    vector.pop();
    return vector;
  }

  public static minVector<T extends any[]>(keyExtractor: (component: any) => number, ...vectors: T[]): T {
    if (!vectors || !vectors[0]) {
      return;
    }

    const resultVector: T = vectors[0];

    for (let index = 0 ; index < vectors[0].length && vectors.length > 1; index++) {
      let currentMinimum = keyExtractor(resultVector[index]);

      for (let vectorIndex = 1 ; vectorIndex < vectors.length ; vectorIndex++) {
        const vector = vectors[vectorIndex];
        const key = keyExtractor(vector[index]);

        if (key < currentMinimum) {
          resultVector[index] = vector[index];
          currentMinimum = key;
        }
      }

    }

    return resultVector;
  }
}
