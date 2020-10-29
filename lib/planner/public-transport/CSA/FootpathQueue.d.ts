import { AsyncIterator } from "asynciterator";
import IConnection from "../../../entities/connections/connections";
export default class FootpathQueue extends AsyncIterator<IConnection> {
    private buffer;
    private shouldClose;
    constructor(backwards?: boolean);
    read(): IConnection;
    write(item: IConnection): void;
    closeAfterFlush(): void;
}
