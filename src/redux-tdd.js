class ReduxTdd {
  constructor(s, render) {
    this.state = { ...s };
    this.render = render;
    this.wrapper = render(this.state);
    this.currentAction = null;
  }

  view() {
    // this.wrapper = this.render(this.state);
    this.wrapper = this.wrapper.setProps(this.state)
    return this;
  }

  reducer(reducer) {
    const newState = reducer(this.state, this.currentAction)
    this.state = newState;
    return this;
  }

  action(mockActionFn) {
    expect(mockActionFn).toHaveBeenCalled();
    this.currentAction = mockActionFn();
    return this;
  }

  simulate(fn) {
    const result = fn(this.wrapper)
    return this;
  }

  toMatchAction(obj) {
    expect(this.currentAction).toMatchObject(obj)
    return this;
  }

  toMatchState(obj) {
    expect(this.state).toMatchObject(obj)
    return this;
  }

  contains(arg) {
    expect(this.wrapper.containsMatchingElement(arg)).toBeTruthy();
    return this;
  }

  debug(cb) {
    cb(this);
    return this;
  }
}

var _old = ReduxTdd;
ReduxTdd = function(...args) { return new _old(...args) };
export default ReduxTdd;
