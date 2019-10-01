import { AsyncIterator } from "asynciterator";
import TinyQueue from "tinyqueue";
import IConnection from "../../../../entities/connections/connections";

export default class MultiConnectionQueue {
    private closed: boolean;
    private asyncIterator: AsyncIterator<IConnection>;
    private queue: TinyQueue<IConnection>;
    private next: IConnection;

    constructor(asyncIterator: AsyncIterator<IConnection>) {
        this.closed = false;
        this.asyncIterator = asyncIterator;
        this.queue = new TinyQueue([], (a, b) => {
            return a.departureTime - b.departureTime;
        });
    }

    public close() {
        this.asyncIterator.close();
        this.closed = true;
    }

    public isClosed(): boolean {
        return this.closed || this.asyncIterator.closed;
    }

    public push(connection: IConnection) {
        this.queue.push(connection);
    }

    public pop(): IConnection {
        if (!this.asyncIterator.readable) {
            return;
        }

        if (!this.next) {
            this.next = this.asyncIterator.read();
        }

        if (!this.next) {
            return this.queue.pop();
        }

        if (this.queue.peek() && this.queue.peek().departureTime < this.next.departureTime) {
            return this.queue.pop();
        }
        const result = this.next;
        this.next = undefined;
        return result;
    }

}
