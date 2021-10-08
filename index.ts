export interface Setter<S> {
  (value: S | ((value: S) => S)): void
  async: (value: ((value: S) => Promise<S>)) => Promise<void>
}

export type StateType<S extends IStore<any>> = S['handler'][0];

export type IStore<S, P extends IStore<any> = any> = {
  parent: P;
  handler: readonly [S, Setter<S>]
  (): readonly [S, Setter<S>];
  subscribe(listener: (state: S, setter: Setter<S>) => void): () => void;
  from<T>(from: (parentState: S, state: T) => T): IStore<T, IStore<S, P>>
  from<T, I extends Partial<T> = Partial<T>>(from: (parentState: S, state: Required<I>) => T, initialValue: I): IStore<T, IStore<S, P>>
  to(to: (parentState: StateType<P>, state: S) => StateType<P>): IStore<S, IStore<S, P>>
}


export function Store<S, P extends IStore<any> = any>(initialState?: S) {
  const store = {
    listeners: [] as Function[],
    handler: [
      initialState as S,
      (function () {
        function set(value: S | ((value: S) => S)) {
          if (typeof value === 'function') {
            value = (value as Function)(store.handler[0]) as S;
          }
          (store.handler[0] as S) = value as S;
          store.listeners.forEach((cb) => cb(...store.handler));
        }
        set.async = async function async(cb: (value: S) => Promise<S>) {
          (store.handler[0] as S) = await cb(store.handler[0]);
          store.listeners.forEach((cb) => cb(...store.handler));
        }
        return set;
      })()
    ] as const
  };

  function storeHandler() {
    return storeHandler.handler;
  }
  storeHandler.handler = store.handler;
  storeHandler.parent = null! as P;

  storeHandler.subscribe = (
    listener: (
      state: typeof store['handler'][0],
      setter: typeof store['handler'][1]
    ) => void
  ) => {
    store.listeners.push(listener);
    return function unsubscribe() {
      const idx = store.listeners.indexOf(listener);
      if (idx === -1) return;
      store.listeners.splice(idx, 1);
    }
  }

  storeHandler.from = <T, I extends Partial<T> = Partial<T>>(from: (parentState: S, state: Required<I>) => T, initialState?: I) => {
    const parent = storeHandler;
    const parentValue = parent.handler[0];
    const subStore = Store<T, IStore<S, P>>(from(parentValue, initialState as any));
    subStore.parent = storeHandler as IStore<S, P>;
    const originalChildStter = subStore.handler[1];
    parent.subscribe((value) => {
      const state = subStore.handler[0];
      originalChildStter(from(value, state as any));
    });
    return subStore;
  }

  storeHandler.to = (to: (parentState: StateType<P>, state: S) => StateType<P>) => {
    if (!storeHandler.parent) throw new Error('No parent defined! Use store.from().to()')

    function set(value: S | ((value: S) => S)) {
      if (typeof value === 'function') {
        value = (value as Function)(storeHandler.handler[0]) as S;
      }
      const parentValue = to(storeHandler.parent.handler[0], value);
      (storeHandler.handler[0] as S) = value;
      storeHandler.parent.handler[1](parentValue);
    }

    set.async = async function async(cb: (value: S) => Promise<S>) {
      const value = await cb(storeHandler.handler[0]);
      const parentValue = to(storeHandler.parent.handler[0], value);
      (storeHandler.handler[0] as S) = value;
      storeHandler.parent.handler[1](parentValue);
    };

    (storeHandler.handler[1] as Setter<S>) = set;
    return storeHandler;
  }

  return storeHandler;
}