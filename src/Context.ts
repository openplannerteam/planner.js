import { Container, injectable } from "inversify";

@injectable()
export default class Context {
  private value: string;
  private container: Container;

  public setContainer(container: Container) {
    this.container = container;
  }

  public getContainer() {
    this.container;
  }

  public setTest(value) {
    this.value = value;
  }

  public getTest() {
    return this.value;
  }
}
