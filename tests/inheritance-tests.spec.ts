import { Store, StateType, InheritError } from '../index';

function getAsyncValue<T>(value: T, timeout: number): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), timeout);
  });
}

describe("inheritance tests", () => {

  test('simple inheritance use from', () => {
    const mapCallback = jest.fn(({x}, {y})=>({x,y}));

    const xStore = Store({x: 0});
    const xyStore = Store<StateType<typeof xStore> & {y: number}>({y: 0})
    .from(xStore)
    .map(mapCallback);
    
    expect(mapCallback).toBeCalledTimes(1);
    
    const args = mapCallback.mock.calls[0];
    expect(args).toHaveLength(2);
    const [parentState, currentState] = args;
    expect(parentState).toEqual({x: 0});
    expect(currentState).toEqual({y: 0});

    const [xy] = xyStore();
    expect(xy).toEqual({x: 0, y: 0});
  });

  test('simple inheritance use from and to', () => {
    const mapFromCallback = jest.fn(({x}, {y})=>({x,y}));
    const mapToCallback = jest.fn(({x}, parent)=>{
      parent.x = x;
      return parent;
    });

    const xStore = Store({x: 0});
    const xyStore = Store<StateType<typeof xStore> & {y: number}>({y: 0})
    .from(xStore)
    .map(mapFromCallback)
    .to(xStore)
    .map(mapToCallback);

    expect(mapFromCallback).toBeCalledTimes(1);
    
    const [,setXY] = xyStore();
    setXY({x: 100, y: 100});
    expect(mapFromCallback).toBeCalledTimes(1);
    expect(mapToCallback).toBeCalledTimes(1);
    
    const args = mapToCallback.mock.calls[0];
    expect(args).toHaveLength(2);
    const [currentState, parentState] = args;
    expect(parentState).toEqual({x: 100});
    expect(currentState).toEqual({x: 100, y: 100});

    const [xy] = xyStore();
    expect(xy).toEqual({x: 100, y: 100});

    const [x] = xStore();
    expect(x).toEqual({x: 100});
  });

  test('multi inheritance use from', () => {
    const xStoreMapCallback = jest.fn(({x}, {y})=>({x,y}));
    const yStoreMapCallback = jest.fn(({y}, {x})=>({x,y}));

    const yStore = Store({y: 0});
    const xStore = Store({x: 0});
    const xyStore = Store<StateType<typeof xStore> & StateType<typeof yStore>>({})
    .from(xStore)
    .map(xStoreMapCallback)
    .from(yStore)
    .map(yStoreMapCallback);
    
    expect(xStoreMapCallback).toBeCalledTimes(1);
    expect(yStoreMapCallback).toBeCalledTimes(1);
    
    const xMapArgs = xStoreMapCallback.mock.calls[0];
    expect(xMapArgs).toHaveLength(2);
    const [xParentState, currentState1] = xMapArgs;
    expect(xParentState).toEqual({x: 0});
    expect(currentState1).toEqual({});

    const yMapArgs = yStoreMapCallback.mock.calls[0];
    expect(yMapArgs).toHaveLength(2);
    const [yParentState, currentState2] = yMapArgs;
    expect(yParentState).toEqual({y: 0});
    expect(currentState2).toEqual({x: 0, y: undefined});

    const [xy] = xyStore();
    expect(xy).toEqual({x: 0, y: 0});
  });

  test('multi inheritance use from and to', () => {
    const xStoreFromMapCallback = jest.fn(({x}, {y})=>({x,y}));
    const xStoreToMapCallback = jest.fn(({x}, parent)=>{
      parent.x = x;
      return parent;
    });
    const yStoreFromMapCallback = jest.fn(({y}, {x})=>({x,y}));
    const yStoreToMapCallback = jest.fn(({y}, parent)=>{
      parent.y = y;
      return parent;
    });

    const yStore = Store({y: 0});
    const xStore = Store({x: 0});
    const xyStore = Store<StateType<typeof xStore> & StateType<typeof yStore>>({})
    .from(xStore)
    .map(xStoreFromMapCallback)
    .to(xStore)
    .map(xStoreToMapCallback)
    .from(yStore)
    .map(yStoreFromMapCallback)
    .to(yStore)
    .map(yStoreToMapCallback);
    
    expect(xStoreFromMapCallback).toBeCalledTimes(1);
    expect(yStoreFromMapCallback).toBeCalledTimes(1);

    const [,setXY] = xyStore();
    setXY({x: 1, y: 2});

    expect(xStoreFromMapCallback).toBeCalledTimes(1);
    expect(yStoreFromMapCallback).toBeCalledTimes(1);

    expect(xStoreToMapCallback).toBeCalledTimes(1);
    expect(yStoreToMapCallback).toBeCalledTimes(1);

    const xArgs = xStoreToMapCallback.mock.calls[0];
    expect(xArgs).toHaveLength(2);

    const [currentState1, xParentState] = xArgs;
    expect(xParentState).toEqual({x: 1});
    expect(currentState1).toEqual({x: 1, y: 2});
    
    const yArgs = yStoreToMapCallback.mock.calls[0];
    expect(yArgs).toHaveLength(2);

    const [currentState2, yParentState] = yArgs;
    expect(yParentState).toEqual({y: 2});
    expect(currentState2).toEqual({x: 1, y: 2});

    const [x] = xStore();
    expect(x).toEqual({x: 1});

    const [y] = yStore();
    expect(y).toEqual({y: 2});
  });

  test('multi inheritance use from and to subscribe to child', () => {
    const subscribeCallback = jest.fn();

    const yStore = Store({y: 0});
    const xStore = Store({x: 0});
    const xyStore = Store<StateType<typeof xStore> & StateType<typeof yStore>>({})
    .from(xStore)
    .map(({x}, {y})=>({x,y}))
    .to(xStore)
    .map(({x}, parent)=>{
      parent.x = x;
      return parent;
    })
    .from(yStore)
    .map(({y}, {x})=>({x,y}))
    .to(yStore)
    .map(({y}, parent)=>{
      parent.y = y;
      return parent;
    });
    
    xyStore.subscribe(subscribeCallback)

    const [,setXY] = xyStore();
    setXY({x: 1, y: 2});

    expect(subscribeCallback).toHaveBeenCalledTimes(1);

    const [x] = xStore();
    expect(x).toEqual({x: 1});

    const [y] = yStore();
    expect(y).toEqual({y: 2});
  });

  test('multi inheritance use from and to subscribe to parents', () => {
    const subscribeXCallback = jest.fn();
    const subscribeYCallback = jest.fn();

    const yStore = Store({y: 0});
    yStore.subscribe(subscribeYCallback);

    const xStore = Store({x: 0});
    xStore.subscribe(subscribeXCallback);
    
    const xyStore = Store<StateType<typeof xStore> & StateType<typeof yStore>>({})
    .from(xStore)
    .map(({x}, {y})=>({x,y}))
    .to(xStore)
    .map(({x}, parent)=>{
      parent.x = x;
      return parent;
    })
    .from(yStore)
    .map(({y}, {x})=>({x,y}))
    .to(yStore)
    .map(({y}, parent)=>{
      parent.y = y;
      return parent;
    });
    
    const [,setXY] = xyStore();
    setXY({x: 1, y: 2});

    expect(subscribeXCallback).toHaveBeenCalledTimes(1);
    expect(subscribeYCallback).toHaveBeenCalledTimes(1);

    const [x] = xStore();
    expect(x).toEqual({x: 1});

    const [y] = yStore();
    expect(y).toEqual({y: 2});
  });

  test('multi inheritance use from twice error', () => {
    const xStore = Store({x: 0});
    try {
      Store<StateType<typeof xStore>>({})
      .from(xStore)
      .map(({x})=>({x}))
      .from(xStore)
      .map(({x})=>({x}))
    } catch (error) {
      expect(error).toBeInstanceOf(InheritError);
      if(error instanceof InheritError) {
        expect(error.message).toEqual(".from() called twice with a same store");
        expect(error.parent).toEqual(xStore);
      }
    }
    
  });

  test('multi inheritance use to twice error', () => {
    const xStore = Store({x: 0});
    try {
      Store<StateType<typeof xStore>>({})
      .to(xStore)
      .map(({x})=>({x}))
      .to(xStore)
      .map(({x})=>({x}))
    } catch (error) {
      expect(error).toBeInstanceOf(InheritError);
      if(error instanceof InheritError) {
        expect(error.message).toEqual(".to() called twice with a same store");
        expect(error.parent).toEqual(xStore);
      }
    }
    
  });

});