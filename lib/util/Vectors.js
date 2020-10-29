"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Helper class for vectors.
 */
class Vectors {
    static shiftVector(vector, item) {
        vector.unshift(item);
        vector.pop();
        return vector;
    }
    static minVector(keyExtractor, ...vectors) {
        if (!vectors || !vectors[0]) {
            return;
        }
        const resultVector = vectors[0];
        for (let index = 0; index < vectors[0].length && vectors.length > 1; index++) {
            let currentMinimum = keyExtractor(resultVector[index]);
            for (let vectorIndex = 1; vectorIndex < vectors.length; vectorIndex++) {
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
exports.default = Vectors;
//# sourceMappingURL=Vectors.js.map