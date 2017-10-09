import { ActionsObservable } from 'redux-observable';
import { shallow } from 'enzyme';

class ReduxTdd {
  constructor(s, reducer, render) {
    this.state = { ...s };
    this.currentAction = null;

    const identity = state => state;

    this.reducer = reducer;
    this.render = render;
    this.components = render(this.state);
    this.wrappers = this.components.map(c => shallow(c))
  }

  view(fn) {
    const arr = fn(this.wrappers);
    arr.forEach((flow, idx) =>
      flow.forEach(func =>
        func(this.wrappers[idx])
      )
    )
    return this;
  }

  action(fn) {
    const action = fn(this.wrappers);
    this.currentAction = action;

    // check if the action object is handled in reducer

    // first: change state
    const newState = this.reducer(this.state, action);
    this.state = newState;

    // second: update view
    if (Array.isArray(this.wrappers)) {
      this.wrappers.forEach((wrapper, idx) =>
        wrapper.setProps(this.render(this.state)[idx].props)
      );
    } else {
      this.wrappers.setProps(this.render(this.state));
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
        this.action(() => actions[0])
      });

    return this;
  }

  contains(arg, truthy = true) {
    if (Array.isArray(this.wrappers)) {
      // arg is a function
      if (truthy) {
        expect(arg(this.wrappers)).toBeTruthy();
      } else {
        expect(arg(this.wrappers)).toBeFalsy();
      }
    } else {
      if (truthy) {
        expect(this.wrappers.containsMatchingElement(arg)).toBeTruthy();
      } else {
        expect(this.wrappers.containsMatchingElement(arg)).toBeFalsy();
      }
    }
    return this;
  }

  toMatchProps(obj) {
    expect(this.wrappers.instance().props).toMatchObject(obj);
    return this;
  }
}

export function props(wrapper) {
  return wrapper.instance().props;
}

export function contains(node) {
  return function (wrapper) {
    if (!wrapper.containsMatchingElement(node)) {
      console.log(wrapper.debug())
      console.log(shallow(node).debug())
    }
    expect(wrapper.containsMatchingElement(node)).toBeTruthy();
  }
}

export function toMatchProps(obj) {
  return function (wrapper) {
    expect(wrapper.instance().props).toMatchObject(obj);
  }
}

var _old = ReduxTdd;
ReduxTdd = function (...args) { return new _old(...args); };
export default ReduxTdd;
