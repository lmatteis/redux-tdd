## Redux TDD

### Install

`npm install --save redux-tdd`

```js
import reduxTdd from 'redux-tdd';

// reduxTdd() takes as arguments an object which will be passed to redux combineReducers()
// and a function which returns an array of components that map your state to props
reduxTdd({ counter: counterReducer }, state =>
  <Counter
    onClick={incrementAction}
    counter={state.counter.count} />
)
.action(props => props.onClick()) // action() takes a function that must return a redux action
.toMatchProps({ counter: 1 }) // toMatchProps() checks whether the component took the correct props
.contains(<span>1</span>) // finally contains() checks that the component contains correct value
```

### About

Read more about this technique in our freeCodeCamp article: https://medium.freecodecamp.org/test-driven-development-with-react-and-redux-using-redux-tdd-3fd3be299918

Also to learn more in depth how to use Redux TDD please look inside the `/test` folder.
