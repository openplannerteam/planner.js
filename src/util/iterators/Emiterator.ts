import { AsyncIterator, SimpleTransformIterator, SimpleTransformIteratorOptions } from "asynciterator";
import Context from "../../Context";
import EventType from "../../EventType";

/**
 * Lazily emits an event of specified type for each item that passes through source iterator
 * This doesn't put the source iterator in flow mode
 */
export default class Emiterator<T> extends SimpleTransformIterator<T, T> {
  constructor(source: AsyncIterator<T>, context: Context, eventType: EventType) {
    if (!context || !eventType) {
      super(source);
    }

    const options: SimpleTransformIteratorOptions<T, T> = {
      map: (item: T) => {
        context.emit(eventType, item);

        return item;
      },
    };

    super(source, options);
  }
}
