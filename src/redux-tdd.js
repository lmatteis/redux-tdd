import { ActionsObservable } from 'redux-observable';
import { combineReducers } from 'redux'
import { shallow } from 'enzyme';

class ReduxTdd {
  constructor(reducers, render) {
    this.currentAction = null;
    this.currentIdx = 0;

    this.reducer = combineReducers(reducers);
    this.state = this.reducer(undefined, { type: '@@redux/INIT'});
    this.render = render;
    this.components = render(this.state);
    this.wrappers = this.components.map(c => shallow(c))
  }

  it(str) {
    it(str, () => undefined)
    return this;
  }

  switch(idx) {
    this.currentIdx = idx;
    return this;
  }

  action(fn) {
    const action = fn(props(this.wrappers[this.currentIdx]));
    this.currentAction = action;

    // check if the action object is handled in reducer

    // first: change state
    const newState = this.reducer(this.state, action);
    this.state = newState;

    // second: update views
    if (Array.isArray(this.wrappers)) {
      this.wrappers.forEach((wrapper, idx) =>
        wrapper.setProps(this.render(this.state)[idx].props)
      );
    }

    return this;
  }

  debug(cb) {
    cb(this);
    return this;
  }

  epic(epicFn, dependencies) {
    const action$ = ActionsObservable.of(this.currentAction);
    const store = null;

    epicFn(action$, store, dependencies)
      .toArray() // buffers all emitted actions until your Epic naturally completes()
      .subscribe(actions => {
        actions.forEach(action =>
          this.action(() => action)
        )
      });

    return this;
  }

  contains(arg, truthy = true) {
    if (truthy) {
      expect(this.wrappers[this.currentIdx].containsMatchingElement(arg)).toBeTruthy();
    } else {
      expect(this.wrappers[this.currentIdx].containsMatchingElement(arg)).toBeFalsy();
    }

    return this;
  }

  view(fn) {
    fn(this.wrappers[this.currentIdx]);
    return this; 
  }

  toMatchProps(obj) {
    expect(this.wrappers[this.currentIdx].instance().props).toMatchObject(obj);
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
