import { AsyncIterator } from "asynciterator";
/**
 * This AsyncIterator maps every item of a query AsyncIterator to a result AsyncIterator by passing it through a
 * `run` function. All result AsyncIterator get concatenated to form the FlatMapIterator
 *
 * ```javascript
 *                  +-----+                     +-----+
 *   queryIterator  |0 & 9| +---+             + |1 & 8| +---+             + ...
 *                  +-----+     |               +-----+     |
 *                              v                           v
 *                  +-----------------------+   +-----------------------+
 * resultIterators  |01|02|04|05|06|07|08|09| + |11|12|13|14|15|16|17|18| + ...
 *                  +-----------------------+   +-----------------------+
 *
 *                  +-----------------------------------------------+
 * FlatMapIterator  |01|02|04|05|06|07|08|09|11|12|13|14|15|16|17|18| ...
 *                  +-----------------------------------------------+
 * ```
 */
export default class FlatMapIterator<Q, R> extends AsyncIterator<R> {
    private queryIterator;
    private callback;
    private currentResultIterator;
    private isLastResultIterator;
    constructor(queryIterator: AsyncIterator<Q>, run: (query: Q) => AsyncIterator<R>);
    read(): R;
    private runQuery;
}
