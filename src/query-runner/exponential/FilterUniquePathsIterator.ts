import { AsyncIterator, SimpleTransformIterator } from "asynciterator";
import IPath from "../../interfaces/IPath";
import Path from "../../planner/Path";

export default class FilterUniquePathsIterator extends SimpleTransformIterator<IPath, IPath> {

  private store: Path[];

  constructor(source: AsyncIterator<IPath>) {
    super(source, {
      maxBufferSize: 1,
      autoStart: false,
    });

    this.store = [];
  }

  public _filter(path: IPath): boolean {

    const isUnique = !this.store
      .some((storedPath: Path) => storedPath.equals(path));

    if (isUnique) {
      this.store.push(path as Path);
    }

    return isUnique;
  }
}
