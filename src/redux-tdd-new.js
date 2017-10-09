import { ActionsObservable } from 'redux-observable';
import { shallow } from 'enzyme';

class ReduxTdd {
  constructor(s, reducer, render) {
    this.state = { ...s };
    this.currentAction = null;
    this.currentIdx = null;

    const identity = state => state;

    this.reducer = reducer;
    this.render = render;
    this.components = render(this.state);
    // console.log(this.components[0].type.name, '')
    this.wrappers = this.components.map(c => shallow(c))
    // console.log(this.wrappers[0])
  }

  test(idx) {
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
        this.action(() => actions[0])
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

  toMatchProps(obj) {
    expect(this.wrappers[this.currentIdx].instance().props).toMatchObject(obj);
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
