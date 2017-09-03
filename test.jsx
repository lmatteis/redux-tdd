import React from 'react';
import { shallow } from 'enzyme';

function Counter({ onIncrement, onReset, count }) {
  return (
    <div>
      <div>{count}</div>
      { count === 10
        ? <button onClick={onReset}>reset</button>
        : <button onClick={onIncrement}>increment</button>
      }
    </div>
  );
}

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

function incrementAction() {
  return {
    type: 'INCREMENT'
  }
}

function resetAction() {
  return {
    type: 'RESET'
  }
}

function reducer(state = { count: 0 }, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 }
    case 'RESET':
      return { count: 0 }
    default:
      return state
  }
}


describe('<Counter />', () => {
  it('should test increment', () => {
    const incrementActionMock = jest.fn(payload => incrementAction(payload))
    const resetActionMock = jest.fn(payload => resetAction(payload))

    new ReduxTdd({ count: 0 }, state => shallow(<Counter onIncrement={incrementActionMock} onReset={resetActionMock} count={state.count} />))
      .simulate(wrapper => wrapper.find('button').simulate('click'))
      .action(incrementActionMock).toMatchAction({ type: 'INCREMENT' })
      .reducer(reducer).toMatchState({ count: 1 })
      .view().contains(<div>{1}</div>)
      .reducer(reducer).toMatchState({ count: 2 })
      .view().contains(<div>{2}</div>)
  })
  it('should test reset haha', () => {
    const incrementActionMock = jest.fn(payload => incrementAction(payload))
    const resetActionMock = jest.fn(payload => resetAction(payload))

    new ReduxTdd({ count: 9 }, state => shallow(<Counter onIncrement={incrementActionMock} onReset={resetActionMock} count={state.count} />))
      .simulate(wrapper => wrapper.find('button').simulate('click'))
      .action(incrementActionMock).toMatchAction({ type: 'INCREMENT' })
      .reducer(reducer).toMatchState({ count: 10 })
      .view().contains(<div>{10}</div>)
      .simulate(wrapper => wrapper.find('button').simulate('click'))
      .action(resetActionMock).toMatchAction({ type: 'RESET' })
      .reducer(reducer).toMatchState({ count: 0 })
  })
})
