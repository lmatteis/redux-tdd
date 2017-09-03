## Redux TDD

![](http://i.imgur.com/YYsyxTE.png)

### Install

`npm install --save redux-tdd`

```js
import ReduxTdd from 'redux-tdd';

ReduxTdd({ count: 0 }, state =>
  <Counter
    onClick={incrementAction}
    counter={state.count} />
)
.simulate(wrapper => wrapper.find(button).simulate('click'))
.action(incrementAction).toMatchAction({ type: 'INCREMENT' })
.reducer(reducer).toMatchState({ count: 1 })
.view().contains(<span>1</span>);
```

### About

Redux allows us to test each individual part of the unidirectional flow independently without having to worry much about doing integration tests. As visualized below, you can test the action, the reducer and the view, individually:

```js
it('should test action is called', () => {
  const wrapper = shallow(<Counter onClick={incrementAction} />);
  wrapper.find(button).simulate(‘click’);
  expect(incrementAction).toHaveBeenCalled();
})
it('should test reducer returns correct value', () => {
  const newState = reducer({ count: 0 }, incrementAction())
  expect(newState).toEqual({ count: 1 });
})
it('should test view is updated correctly', () => {
  const wrapper = shallow(<Counter counter={1} />);
  expect(wrapper).toMatch(<span>1</span>);
})
```

However, when it comes to doing TDD (test-driven development), you usually want to test things in succession: a certain click triggers a certain state-change which triggers a UI change. Meaning that these 3 tests above should be streamlined - there should be a way to easily plug them together more naturally instead of having to write 3 separate unit tests.

You could simply initialize a redux-mock-store and `mount()` your container component to achieve this, but you'd need to call `mount()` which is more expensive. Also, the unit tests above are testing pure functions and don't require all of the overhead that an integration test requires.

**The insight here is that each output of the redux unidirectional data-flow step, should be fed to the next unit test, to allow a more TDD-friendly development:**

```js
render(state) {
  return shallow(<Counter onClick={incrementAction} counter={state.count} />);
}

// action unit test
const action = { type: ‘INCREMENT’ };
const state = { count: 0 };
const wrapper = render(state);
wrapper.find(button).simulate(‘click’);
expect(incrementAction).toHaveBeenCalled();

// reducer unit test
const newState = reducer(state, action)
expect(newState).toEqual({ count: 1 });

// view unit test
const wrapper = render(newState);
expect(wrapper).toMatch(<span>1</span>);
```

### Dot-chaining everything

Here we propose a dot-chaining syntax API that allows you to plug each of these "unit tests" together to make it easier to do TDD:

```js
ReduxTdd({ count: 0 }, state => <Counter onClick={incrementAction} counter={state.count} />)
  .simulate(wrapper => wrapper.find(button).simulate('click'))
  .action(incrementAction).toReturn({ type: 'INCREMENT' }) // checks that `incrementAction` is called and returns this object
  .reducer(reducer).toEqual({ count: 1 }) // checks that, given the current state of the flow, and the earlier action `reducer({ type: 'INCREMENT' })` returns this object
  .view().toMatch(<span>1</span>); // uses new state from reducer and re-renders the view to check if value matches
```

The above example is exactly the same as the first example, but with a much slimmer API surface and less local variables dangling around. What's important to note is that each section is actually a unit-test; it's testing pure functions and passing the output to the next step.

**This dot-chaining model forces you to test the redux unidirectional flow! Specifically it forces you to unit-test each step with the inputs from the earlier step.**

Here's a more complex example:

```js
ReduxTdd({ count: 9 }, state => <ResetCounter at={10} onClick={incrementAction} counter={state.count} />)
  .simulate(wrapper => wrapper.find(button).simulate('click'))
  .action(incrementAction)
  .reducer(reducer).toEqual({ count: 10 })
  .view().toMatch(<span>10</span>)
  .simulate(wrapper => wrapper.find(button).simulate('click'))
  .action(incrementAction)
  .reducer(reducer).toEqual({ count: 0 })
  .view().toMatch(<span>0</span>)
 ```

### Async actions

There maybe cases where a dispatched action does not trigger reducer or state changes. It may be "handled" by an epic which would then dispatch other actions accordingly:

```js
ReduxTdd({ count: 9 }, state => <Counter onClick={incrementAsyncAction} counter={state.count} />)
  .simulate(wrapper => wrapper.find(button).simulate('click'))
  .action(incrementAsyncAction).toReturn({ type: ‘INCREMENT_ASYNC’ })
  .epic(handleIncrementAsyncEpic, { getJSON: () => Observable.of({ type: 'INCREMENT_SUCCESS' }) })
  // now since we mocked the epic, we can continue normal reducer->view testing
  .reducer(reducer).toEqual({ count: 10 })
  .view().toMatch(<span>10</span>)
  // and we can plug another side-effect (this time failure)
  .epic(handleIncrementAsyncEpic, { getJSON: () => Observable.of({ type: 'INCREMENT_FAILURE' }) })
  // since it's failure, it will not increase it to 11
  .reducer(reducer).toEqual({ count: 10 })
  .view().toMatch(<span>10</span>)
```

Or with other types of middlewares such as redux-thunk which "dispatches" multiple actions asynchronously:

```js
ReduxTdd({ count: 9 }, state => <Counter onClick={incrementAsyncAction} counter={state.count} />)
  .simulate(wrapper => wrapper.find(button).simulate('click'))
  // incrementAsyncThunk() dispatches 'INCREMENT_ASYNC' and then we force (in a promise) 'INCREMENT_SUCCESS'
  .thunk(incrementAsyncThunk, () => Promise.resolve('INCREMENT_SUCCESS'))
  .toEqual([ { type: 'INCREMENT_ASYNC' }, { type: 'INCREMENT_SUCCESS' } ])
  .reducer(reducer).toEqual({ count: 9 }) // first we test INCREMENT_ASYNC (which doesn't increment)
  .reducer(reducer).toEqual({ count: 10 }) // next we test INCREMENT_SUCCESS (which does increment)
  .view().toMatch(<span>10</span>)
  // and we can continue the flow with a FAILURE
  .thunk(incrementAsyncThunk, () => Promise.resolve('INCREMENT_FAILURE'))
  .toEqual([ { type: 'INCREMENT_ASYNC' }, { type: 'INCREMENT_FAILURE' } ])
  .reducer(reducer).toEqual({ count: 10 }) // first we test INCREMENT_ASYNC (which doesn't increment)
  .reducer(reducer).toEqual({ count: 10 }) // next we test INCREMENT_FAILURE (which doesn't increment)
  .view().toMatch(<span>10</span>)
```

### What's the difference between integration tests?

The tests above are not actually integration tests - that would require a full-blown DOM enviroment where the actual simulation triggers state changes to the Redux store.

However, we can simulate integration tests by composing unit-tests together in the same order they happen in the redux data-flow.

So we can write integration-like tests - which are easier to write and read - with the speed of executing unit-tests.
