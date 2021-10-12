export interface Setter<S> {
  (value: S | ((value: S) => S)): void
  async: (value: ((value: S) => Promise<S>)) => Promise<void>
}

export type StoreHandler<S> = [S, Setter<S>];

export type StateType<S extends IStore<any>> = S['handler'][0];

export type IStore<S> = {
  handler: StoreHandler<S>;
  (): StoreHandler<S>;
  subscribe(listener: (state: S, setter: Setter<S>) => void): () => void;
  from<P>(parent: IStore<P>): {
    map(map: (parentState: P, currentState: S)=>S): IStore<S>
  }
  to<P>(parent: IStore<P>): {
    map(map: (currentState: S, parentState: P)=>P): IStore<S>
  }
}

export type StoreValue<T extends IStore<any>> = T extends IStore<infer V> ? V : any;

function createSetter<S>(getStore: ()=>{listeners: Function[], handler: StoreHandler<S>}) {
  function set(value: S | ((value: S) => S)) {
    const store = getStore();
    if (typeof value === 'function') {
      value = (value as Function)(store.handler[0]);
      if(value === undefined) value = store.handler[0];
    }
    store.handler[0] = value as S;
    store.listeners.forEach((cb) => cb(...store.handler));
  }
  set.async = async function async(cb: (value: S) => Promise<S>) {
    const store = getStore();
    store.handler[0] = await cb(store.handler[0]);
    store.listeners.forEach((cb) => cb(...store.handler));
  }
  return set;
}

function createParentSetter<P, S>(parent: IStore<P>, state: IStore<S>, map: (currentState: S, parentState: P)=>P) {
  function set(value: S | ((value: S) => S)) {
    const [currentState] = state();
    const [parentState, parentSetter] = parent();
    if (typeof value === 'function') {
      value = (value as Function)(currentState);
    }
    state.handler[0] = value as S;
    parentSetter(map(value as S, parentState));
  }
  set.async = async function async(cb: (value: S) => Promise<S>) {
    const [currentState] = state();
    const [parentState, parentSetter] = parent();
    const value = await cb(currentState);
    state.handler[0] = value;
    parentSetter(map(value, parentState));
  }
  return set;
}

export function Store<S>(initialState?: S extends Object ? Partial<S> : S) {
  const setter: Setter<S> = createSetter<S>(()=>store);
  const fromStores: IStore<any>[] = [];
  const store = {
    listeners: [] as Function[],
    handler: [
      initialState as S,
      setter
    ] as StoreHandler<S>
  };

  function storeHandler() {
    return storeHandler.handler;
  }
  storeHandler.handler = store.handler;

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

  storeHandler.from = <P>(parent: IStore<P>) => {
    if(fromStores.indexOf(parent) > -1) throw {
      message: ".from() called twice with a same store",
      store: parent
    }
    fromStores.push(parent);
    return {
      map(map: (parentState: P, currentState: S)=>S) {
        parent.subscribe(()=>{
          setter(map(parent.handler[0], store.handler[0]))
        })
        if(store.handler[0] !== undefined) store.handler[0] = map(parent.handler[0], store.handler[0]);
        return storeHandler;
      }
    }
  }

  storeHandler.to = <P>(parent: IStore<P>) => {
    if(fromStores.indexOf(parent) === -1) throw {
      message: ".to() cannot call without .from()",
      store: parent
    }
    return {
      map(map: (currentState: S, parentState: P)=>P) {
        store.handler[1] = createParentSetter(parent, storeHandler, map)
        return storeHandler;
      }
    }
  }

  return storeHandler;
}

const x = Store({x: 0})
const xy = Store<{x: number, y: number}>({y: 0})

.from(x)
.map(({x},{y})=>({x,y}))

.to(x)
.map(({x}, parent)=>{
  parent.x = x;
  return parent;
});
