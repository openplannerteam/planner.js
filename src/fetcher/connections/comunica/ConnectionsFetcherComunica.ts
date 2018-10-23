import { injectable } from "inversify";
import IConnection from "../IConnection";
import IConnectionsFetcher from "../IConnectionsFetcher";

@injectable()
export default class ConnectionsFetcherComunica implements IConnectionsFetcher {
  public fetch: () => AsyncIterator<IConnection>;

  public [Symbol.asyncIterator](): AsyncIterator<IConnection> {
    return undefined;
  }

}
