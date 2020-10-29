import { AsyncIterator } from "asynciterator";
/**
 * An AsyncIterator that allows "writing" items to it externally
 *
 * It uses a buffer internally, so items can be written synchronously and asynchronously
 */
export default class ExpandingIterator<T> extends AsyncIterator<T> {
    private buffer;
    private shouldClose;
    constructor();
    read(): T;
    write(item: T): void;
    closeAfterFlush(): void;
}
