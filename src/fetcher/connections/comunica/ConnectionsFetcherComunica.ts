import { injectable } from "inversify";
import IConnection from "../IConnection";
import IConnectionsFetcher from "../IConnectionsFetcher";
import IConnectionsFetcherConfig from "../IConnectionsFetcherConfig";

@injectable()
export default class ConnectionsFetcherComunica implements IConnectionsFetcher {
  public fetch: () => AsyncIterator<IConnection>;
  public setConfig: (config: IConnectionsFetcherConfig) => void;

  public [Symbol.asyncIterator](): AsyncIterator<IConnection> {
    return undefined;
  }

}
