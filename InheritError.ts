import { IStore } from "./Store";

export class InheritError extends Error {
  constructor(message: string, public parent: IStore<any>) {
    super(message);
    Object.setPrototypeOf(this, InheritError.prototype);
  }
}
