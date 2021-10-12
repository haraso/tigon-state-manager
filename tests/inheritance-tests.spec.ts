import { Store, StoreValue } from '../index';

function getAsyncValue<T>(value: T, timeout: number): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), timeout);
  });
}

describe("inheritance tests", () => {

  test('simple inheritance use from', () => {
    const mapCallback = jest.fn(({x}, {y})=>({x,y}));

    const xStore = Store({x: 0});
    const xyStore = Store<StoreValue<typeof xStore> & {y: number}>({y: 0})
    .from(xStore)
    .map(mapCallback);
    
    expect(mapCallback.mock.calls).toHaveLength(1);
    
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
    const xyStore = Store<StoreValue<typeof xStore> & {y: number}>({y: 0})
    .from(xStore)
    .map(mapFromCallback)
    .to(xStore)
    .map(mapToCallback);

    expect(mapFromCallback).toBeCalledTimes(1);
    
    const [,setXY] = xyStore();
    setXY({x: 100, y: 100});
    expect(mapFromCallback).toBeCalledTimes(2);
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

});