## Redux TDD

### Install

`npm install --save-dev redux-tdd`


Also, redux-observable is a peer-dependency so make sure you have it installed before you use Redux TDD: `npm install  --save-dev redux-observable`

### Example

```js
import reduxTdd from 'redux-tdd';

// reduxTdd() takes as arguments an object which will be passed to redux combineReducers()
// and a function which returns an array of components that map your state to props
reduxTdd({ counter: counterReducer }, state => [
  <Counter
    onClick={incrementAction}
    counter={state.counter.count} />
])
.action(props => props.onClick()) // action() takes a function that must return a redux action
.toMatchProps({ counter: 1 }) // toMatchProps() checks whether the component took the correct props
.contains(<span>1</span>) // finally contains() checks that the component contains correct value
```

### Testing multiple components

You can return multiple components (it's an array) if you want to test how they work with each other. Then you can use the `.switch('ComponentName')` operator to assert certain things about the component. You can also use the `.it(string)` to document what you're testing so it's easier to know where things break:

```js
const TodoList = ({ listItems }) =>
  <div>
    {listItems.map(i => <div key={i}>{i}</div>)}
  </div>

const AddTodo = ({ onAdd }) =>
  <button onClick={onAdd}>add todo</button>

function addTodo(todoText) {
  return { type: 'ADD_TODO', payload: todoText }
}

function getVisibleItems(state) {
  return Object.keys(state.list).length
    ? Object.keys(state.list).map(key => key)
    : []
}

function list(state = {}, action) {
  switch (action.type) {
    case 'ADD_TODO':
      return { ...state, [action.payload]: {} }
    default:
      return state
  }
}

reduxTdd({ list }, state => [
  <TodoList listItems={getVisibleItems(state)} />,
  <AddTodo onAdd={addTodo} />
])
.it('should add a todo item')
  .switch('AddTodo') // the next dot-chained calls will work on AddTodo
    .action(props => props.onAdd('clean house')) // add 'clean house'
  .switch('TodoList') // back to TodoList
    .toMatchProps({ listItems: ["clean house"] })
```

### Async behavior

Testing async behavior with Redux TDD can currently only be done using redux-observable. There's a specific `.epic()` operator that works such as:

```js
function fetchItems() {
  return { type: 'FETCH_ITEMS' }
}

function handleFetchItems(action$, store, { getJSON }) {
  return action$
    .ofType('FETCH_ITEMS')
    .switchMap(action =>
      getJSON('http://foo')
        .map(response =>
          response.reduce((acc, curr) =>
            ({
              ...acc,
              [curr.id]: curr,
            })
          , {})
        )
        .map(response => recievedItems(response))
    )
}

reduxTdd({ items }, state => ([
    <Items
      items={state.items}
      fetchItems={fetchItems}
    />
  ]))
  .it('should load items')
    .action(props => props.fetchItems())
    .epic(handleFetchItems, { getJSON: () =>
      // force/mock the API call to return this JSON
      Observable.of([
        { id: 1, name: 'Foo', date: 'March' },
        { id: 2, name: 'Bar', date: 'November' }
      ])
    })
    .toMatchProps({ items:
      {
        1: { id: 1, name: 'Foo', date: 'March' },
        2: { id: 2, name: 'Bar', date: 'November' }
      }
    })
```

`.epic()` works similar to the `.action()` operator, in the sense that it will dispatch the action returned by the epic, so you can chain `.toMatchProps()` after it to assert things about your components.

### Handling multiple async actions dispatched

In redux-observable you may find yourself dispatching multiple actions:

```js
function handleRefreshEpic(action$, store, { getJSON }) {
  return action$.ofType('REFRESH')
    .mergeMap(() =>
      getJSON('http://foo.bar')
        .map(response => refreshDoneAction(response))
        .catch(err => Observable.of(refreshFailAction(err), setErrorAction(err)))
    );
}
```

As you can see, this epic above will dispatch two actions if an error occurs. To test this in Redux TDD we can test the first action (`refreshFailAction`) as we did before:

```js
.it('should click refresh and simulate http error response')
  .action(actions.clickRefreshBtn)
  .epic(handleRefreshEpic, { getJSON: () =>
    Observable.throw({ error: 'Some error' })
  })
  .toMatchProps({
    loading: false,
    projects: [],
  })
```

And to test the second action (`setErrorAction`), we can call `.action()` again and use its second parameter to access the epicAction in the pipe. If your epic would return a third action, you can call .action again and things would be automatically shifted from the internal pipeline.

```js
  // consume the second action emitted by observable
  .action((props, epicAction) => {
    expect(epicAction).toMatchObject({ type: 'ERROR', payload: { error: 'Some error' } })
    return epicAction
  })
  .switch('Error')
  .toMatchProps({
    message: 'Some error'
  })
```

This is really cool because you can test in between your async calls, and make sure all your components render as expected.

### About

Check out my HOW-TO article on Hacker Noon: https://hackernoon.com/redux-tdd-a-deep-dive-344cd7682a54

Also to learn more in depth how to use Redux TDD please look inside the `/test` folder.
