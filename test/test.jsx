import React from 'react';
import { shallow } from 'enzyme';
import ReduxTdd from '../src/redux-tdd';

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

    ReduxTdd({ count: 0 }, state => shallow(<Counter onIncrement={incrementActionMock} onReset={resetActionMock} count={state.count} />))
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

    ReduxTdd({ count: 9 }, state => shallow(<Counter onIncrement={incrementActionMock} onReset={resetActionMock} count={state.count} />))
      .simulate(wrapper => wrapper.find('button').simulate('click'))
      .action(incrementActionMock).toMatchAction({ type: 'INCREMENT' })
      .reducer(reducer).toMatchState({ count: 10 })
      .view().contains(<div>{10}</div>)
      .simulate(wrapper => wrapper.find('button').simulate('click'))
      .action(resetActionMock).toMatchAction({ type: 'RESET' })
      .reducer(reducer).toMatchState({ count: 0 })
  })
})

/*
const myTest = flow(
  action(incrementActionMock)({ type: 'INCREMENT' }), // { state, wrapper, action }
  reducer(reducer)({ count: 1 }), // { newState, wrapper, action }
  view(<div>{1}</div>), // { newState, newWrapper, action }
)({ count: 0 }, state => shallow(<Counter onIncrement={incrementActionMock} onReset={resetActionMock} count={state.count} />))

run(myTest) // takes all the data from the test above, and actually runs expect() against it
*/
