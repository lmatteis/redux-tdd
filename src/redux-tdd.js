class ReduxTdd {
  constructor(s, render) {
    this.state = { ...s };
    this.render = render;
    this.currentAction = null;

    this.wrappers = render(this.state);
  }

  view() {
    if (Array.isArray(this.wrappers)) {
      this.wrappers.forEach(wrapper =>
        wrapper.setProps(this.state)
      );
    } else {
      this.wrappers.setProps(this.state);
    }
    return this;
  }

  reducer(reducer) {
    const newState = reducer(this.state, this.currentAction);
    this.state = newState;
    return this;
  }

  action(mockActionFn) {
    if (mockActionFn.fn) {
      expect(mockActionFn).toHaveBeenCalled();
      const firstCall = mockActionFn.mock.calls[0];
      this.currentAction = mockActionFn(...firstCall);
    } else {
      this.currentAction = mockActionFn();
    }
    return this;
  }

  simulate(fn) {
    const result = fn(this.wrappers);
    return this;
  }

  toMatchAction(obj) {
    expect(this.currentAction).toMatchObject(obj);
    return this;
  }

  toMatchState(obj) {
    expect(this.state).toMatchObject(obj);
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

  debug(cb) {
    cb(this);
    return this;
  }
}

var _old = ReduxTdd;
ReduxTdd = function (...args) { return new _old(...args); };
export default ReduxTdd;
