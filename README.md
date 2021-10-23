# tigon-state-manager

This is a simple and lightweight state manager.

## How to use

### Create store:

- Create store with string
```ts
import { Store } from "@tigon/state-manager";

const userNameStore = Store<String>("Mr. Developer");
```
---

- Create store with object
```ts
import { Store } from "@tigon/state-manager";

const userNameStore = Store<{ username: string }>({ username: "" });
```
```ts
import { Store } from "@tigon/state-manager";

const userEmailStore = Store<{ email: string }>({ email: "" });
```

---
---

### Connect stores:

- One way connection
  - It means every time when `userDetailsStore` change the `userNameStore` change as well. 
  - WARNING
    - If `userNameStore` change `userDetailsStore` will not change.
    - Parent default value automatically overrides the child value.
```ts
const userDetailsStore = Store({ username: "", email: "" })

...

const userNameStore = Store({ username: "" })
.from(userDetailsStore)
.map((parentState, currentState) => {
    currentState.username = parentState.username;
    return currentState;
});
```

---

- Two way connection
  - It means every time when `userDetailsStore` or `userNameStore` change the other store change as well.
```ts
const userDetailsStore = Store({ username: "", email: "" })
...

const userNameStore = Store({ username: "" })

.from(userDetailsStore)
.map((parentState, currentState) => {
    currentState.username = parentState.username;
    return currentState;
})
.to(userDetailsStore)
.map((currentState, parentState) => {
    parentState.username = currentState.username;
    return parentState;
});
```

---

- Multiple two way connection
```ts
const userNameStore = Store({ username: "" })

...

const userEmailStore = Store({ email: "" })

...

const userDetailsStore = Store({ username: "", email: "" })

.from(userNameStore)
.map((parentState, currentState) => {
    currentState.username = parentState.username;
    return currentState;
})
.to(userNameStore)
.map((currentState, parentState) => {
    parentState.username = currentState.username;
    return parentState;
})

.from(userEmailStore)
.map((parentState, currentState) => {
    currentState.email = parentState.email;
    return currentState;
})
.to(userEmailStore)
.map((currentState, parentState) => {
    parentState.email = currentState.email;
    return parentState;
});
```
---
---

### Use store:

- Use store value
```ts
import { Store } from "@tigon/state-manager";

const userNameStore = Store<String>("Mr. User");

...

const [username, setUserName] = userNameStore();

console.log(username); //Mr. User
```

---

- Set store value
```ts
import { Store } from "@tigon/state-manager";

const userNameStore = Store<String>("Mr. User");

...

const [, setUserName] = userNameStore();

setUserName("Dr. User");

const [username] = userNameStore();

console.log(username); //Dr. User
```

```ts
import { Store } from "@tigon/state-manager";

const userNameStore = Store<String>("Mr. User");

...

const [, setUserName] = userNameStore();

setUserName((state) => state.replace("Mr.", "Dr."));

const [username] = userNameStore();

console.log(username); //Dr. User
```

---

- Set store value async
```ts
import { Store } from "@tigon/state-manager";

const userNameStore = Store<String>("Mr. User");

...

const [, setUserName] = userNameStore();

setUserName.async(async (state) => `${state} ${await fetchUserLastName(state)}`));
```

---
---

### Subscribe / Unsubscribe store changes:

```ts
import { Store } from "@tigon/state-manager";

const userNameStore = Store<String>("Mr. User");

...

const unsubscribe = userNameStore.subscribe((currentState, setState) => {

...

});

...

unsubscribe();
```

---
---

## Small details

- Every store handler is a same array. ex.:
```ts
const handler_1 = store();
const handler_2 = store();

console.log(handler_1 === handler_2); //true
```

---

- Every setState is a same function. ex.:
```ts
const [, setState_1] = store();
const [, setState_2] = store();

console.log(setState_1 === setState_2); //true
```