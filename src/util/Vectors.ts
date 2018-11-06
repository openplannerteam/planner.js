export default class Vectors {

  public static shiftVector<T extends any[]>(vector: T): T {
    vector.unshift(Infinity);
    vector.pop();
    return vector;
  }

  public static minVector<T extends any[]>(...vectors: T[]): T {
    if (!vectors || !vectors[0]) {
      return;
    }

    const result: T = vectors[0];
    for (let vectorIndex = 1 ; vectorIndex < vectors.length ; vectorIndex++) {
      for (let numberIndex = 0 ; numberIndex < vectors[vectorIndex].length ; numberIndex++) {
        if (vectors[vectorIndex][numberIndex] < result[numberIndex]) {
          result[numberIndex] = vectors[vectorIndex][numberIndex];
        }
      }
    }
    return result;
  }
}
