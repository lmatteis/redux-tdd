import { ActionsObservable } from 'redux-observable';

class ReduxTdd {
  constructor(s, reducer, render, mapStateToProps) {
    this.state = { ...s };
    this.currentAction = null;

    const identity = state => state;

    this.reducer = reducer;
    this.mapStateToProps = mapStateToProps || identity;
    this.wrappers = render(this.state);
  }

  view(fn) {
    fn(this.wrappers);
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
      this.wrappers.forEach(wrapper =>
        wrapper.setProps(this.mapStateToProps(this.state))
      );
    } else {
      this.wrappers.setProps(this.mapStateToProps(this.state));
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
}

export function props(wrapper) {
  return wrapper.instance().props;
}

export function contains(node, wrapper) {
  return wrapper.containsMatchingElement(node);
}


var _old = ReduxTdd;
ReduxTdd = function (...args) { return new _old(...args); };
export default ReduxTdd;
