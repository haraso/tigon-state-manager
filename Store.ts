import { InheritError } from "./InheritError";
import { createSetter } from "./createSetter";
import { createDetector } from "./createDetector";

export interface Setter<S> {
  (value: S | ((value: S) => S)): void;
  async: (value: ((value: S) => Promise<S>)) => Promise<void>;
}

export type StoreHandler<S> = [S, Setter<S>];

export type StateType<S extends IStore<any>> = S['handler'][0];

export type IStore<S> = {
  handler: StoreHandler<S>;
  (): StoreHandler<S>;
  subscribe(listener: (state: S, setter: Setter<S>) => void): () => void;
  detect(detector: (state: S) => any[]): {
    subscribe(listener: (state: S, setter: Setter<S>) => void): () => void;
  }
  from<P>(parent: IStore<P>): {
    map(map: (parentState: P, currentState: S) => S): IStore<S>;
  };
  to<P>(parent: IStore<P>): {
    map(map: (currentState: S, parentState: P) => P): IStore<S>;
  };
};

export function Store<S extends Object>(
  initialState?: S extends Object ? Partial<S> : S,
  defaultDetector?: (state: S) => any[]
) {
  const fromStores: IStore<any>[] = [];
  const toStores: IStore<any>[] = [];
  const setters: ((value: S) => void)[] = [];
  const setting: { skipMapFrom: boolean; } = { skipMapFrom: false };

  const originalSetter = (value: S) => {
    store.handler[0] = value as S;
    store.listeners.forEach((cb) => cb(...store.handler));
  };
  setters.unshift(originalSetter);

  const subscribe = (
    listener: (
      state: typeof store['handler'][0],
      setter: typeof store['handler'][1]
    ) => void,
    detector?: (state: S) => any[]
  ) => {
    if (detector) listener = createDetector(listener, detector, storeHandler.handler);
    store.listeners.push(listener);
    return function unsubscribe() {
      const idx = store.listeners.indexOf(listener);
      if (idx === -1)
        return;
      store.listeners.splice(idx, 1);
    };
  };

  const store: {
    listeners: Function[];
    handler: StoreHandler<S>;
  } = {
    listeners: [] as Function[],
    handler: [
      initialState as S,
      createSetter<S>(() => store.handler[0], setters, setting)
    ]
  };

  function storeHandler() {
    return storeHandler.handler;
  }
  storeHandler.handler = store.handler;

  storeHandler.detect = (detector: (state: S) => any[]) => ({
    subscribe(
      listener: (
        state: typeof store['handler'][0],
        setter: typeof store['handler'][1]
      ) => void
    ) {
      return subscribe(listener, detector);
    }
  })

  storeHandler.subscribe = (
    listener: (
      state: typeof store['handler'][0],
      setter: typeof store['handler'][1]
    ) => void
  ) => subscribe(listener, defaultDetector);

  storeHandler.from = <P>(parent: IStore<P>) => {
    if (fromStores.indexOf(parent) > -1)
      throw new InheritError(
        ".from() called twice with a same store",
        parent
      );
    fromStores.push(parent);
    return {
      map(map: (parentState: P, currentState: S) => S) {
        parent.subscribe(() => {
          if (setting.skipMapFrom)
            return;
          originalSetter(map(parent.handler[0], store.handler[0]));
        });
        if (store.handler[0] !== undefined)
          store.handler[0] = map(parent.handler[0], store.handler[0]);
        return storeHandler;
      }
    };
  };

  storeHandler.to = <P>(parent: IStore<P>) => {
    if (toStores.indexOf(parent) > -1)
      throw new InheritError(
        ".to() called twice with a same store",
        parent
      );
    toStores.push(parent);
    return {
      map(map: (currentState: S, parentState: P) => P) {
        setters.unshift((value) => {
          const [parentState, parentSetter] = parent();
          parentSetter(map(value as S, parentState));
        });
        return storeHandler;
      }
    };
  };

  return storeHandler;
}
