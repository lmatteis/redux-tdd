import { ActionsObservable } from 'redux-observable';
import { combineReducers } from 'redux'
import { shallow } from 'enzyme';

class ReduxTdd {
  constructor(reducers, render) {
    this.currentAction = null;
    this.currentKey = 0;
    this.epicActions = [];

    this.reducer = combineReducers(reducers);
    this.state = this.reducer(undefined, { type: '@@redux/INIT'});
    this.render = render;
    this.components = render(this.state); // [ <Component1 />, <Component2 /> ]
    this.wrappers = this.components.reduce((acc, curr) =>
      ({
        ...acc,
        [curr.type.name]: shallow(curr)
      })
      //shallow(c)
    , {}) // { 'Component1' -> shallow(Component1) }
  }

  getCurrentWrapper() {
    if (typeof this.currentKey === 'number') { // .switch(1)
      return this.wrappers[Object.keys(this.wrappers)[this.currentKey]];
    } else if (typeof this.currentKey === 'string') { // .switch('Foo')
      return this.wrappers[this.currentKey];
    } else if (typeof this.currentKey === 'function') { // .switch(Foo)
      return this.wrappers[this.currentKey.name];
    }
  }

  it(str) {
    it(str, () => undefined)
    return this;
  }

  switch(key) {
    this.currentKey = key;
    return this;
  }

  action(fn) {
    const action = fn(props(this.getCurrentWrapper()), this.epicActions.shift());
    this.currentAction = action;

    // check if the action object is handled in reducer

    // first: change state
    const newState = this.reducer(this.state, action);
    this.state = newState;

    // second: update views
    Object.keys(this.wrappers).forEach((key, idx) =>
      this.wrappers[key].setProps(this.render(this.state)[idx].props)
    );

    return this;
  }

  debug(cb) {
    cb(this);
    return this;
  }

  epic(epicFn, dependencies) {
    const action$ = ActionsObservable.of(this.currentAction);
    const store = {
      getState: () => this.state
    };

    epicFn(action$, store, dependencies)
      .toArray() // buffers all emitted actions until your Epic naturally completes()
      .subscribe(actions => {
        // only run automatically the first one
        actions.forEach((action, idx) =>
          idx === 0 && this.action(() => action)
        );
        actions.shift()
        this.epicActions = actions;
      });

    return this;
  }

  contains(arg, truthy = true) {
    if (truthy) {
      expect(this.getCurrentWrapper().containsMatchingElement(arg)).toBeTruthy();
    } else {
      expect(this.getCurrentWrapper().containsMatchingElement(arg)).toBeFalsy();
    }

    return this;
  }

  view(fn) {
    fn(this.getCurrentWrapper());
    return this;
  }

  toMatchProps(obj) {
    expect(this.getCurrentWrapper().instance().props).toMatchObject(obj);
    return this;
  }
}

export function props(wrapper) {
  return wrapper.instance().props;
}
//
// export function contains(node) {
//   return function (wrapper) {
//     if (!wrapper.containsMatchingElement(node)) {
//       console.log(wrapper.debug())
//       console.log(shallow(node).debug())
//     }
//     expect(wrapper.containsMatchingElement(node)).toBeTruthy();
//   }
// }
//
// export function toMatchProps(obj) {
//   return function (wrapper) {
//     expect(wrapper.instance().props).toMatchObject(obj);
//   }
// }

var _old = ReduxTdd;
ReduxTdd = function (...args) { return new _old(...args); };
export default ReduxTdd;
