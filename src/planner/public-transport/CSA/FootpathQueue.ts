import { AsyncIterator } from "asynciterator";
import TinyQueue from "tinyqueue";
import IConnection from "../../../entities/connections/connections";

export default class FootpathQueue extends AsyncIterator<IConnection> {

    private buffer: TinyQueue<IConnection>;
    private shouldClose: boolean;

    constructor(backwards = false) {
        super();

        if (backwards) {
            this.buffer = new TinyQueue([], (a, b) => {
                return b.departureTime - a.departureTime;
            });
        } else {
            this.buffer = new TinyQueue([], (a, b) => {
                return a.departureTime - b.departureTime;
            });
        }

        this.readable = true;
        this.shouldClose = false;

        this.setMaxListeners(100);
    }

    public read(): IConnection {
        let item;

        if (this.buffer.length) {
            item = this.buffer.pop();
        } else {
            item = null;
        }

        if (this.shouldClose) {
            this.close();
        }

        return item;
    }

    public write(item: IConnection): void {
        if (!this.shouldClose) {
            this.buffer.push(item);
            this.readable = true;
        }
    }

    public closeAfterFlush(): void {
        this.shouldClose = true;
    }
}
