import { Container, injectable } from "inversify";

@injectable()
export default class Context {
  private container: Container;

  public setContainer(container: Container) {
    this.container = container;
  }

  public getContainer() {
    return this.container;
  }
}
