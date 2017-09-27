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

function Modal({ show }) {
  return (
    <div>
      { show &&
        <div className="showModal"></div>
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

function multipleComponentsReducer(state = { count: 0, show: false }, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1, show: (state.count + 1) % 2 !== 0 }
    case 'RESET':
      return { ...state, count: 0 }
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
  it('should test reset', () => {
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

describe('<Counter /> and <Modal />', () => {
  it('should test interaction between multiple components', () => {
    const incrementActionMock = jest.fn(payload => incrementAction(payload))
    ReduxTdd({ count: 0, show: false }, state => ([
      shallow(
        <Counter
          onIncrement={incrementActionMock}
          counter={state.count} />
      ),
      shallow(
        <Modal
          show={state.show} />
      )
    ]))
    .simulate(([ counterWrapper, modalWrapper ]) =>
      counterWrapper.instance().props.onIncrement() // simulate a click
    )
    .action(incrementActionMock).toMatchAction({ type: 'INCREMENT' })
    // should show modal when state.count is odd
    .reducer(multipleComponentsReducer).toMatchState({ count: 1, show: true })
    .view().contains(([ counter, modal ]) =>
      counter.contains(<div>{1}</div>) &&
      modal.contains(<div className="showModal" />)
    )
    .simulate(([ counterWrapper, modalWrapper ]) =>
      counterWrapper.instance().props.onIncrement() // simulate a click
    )
    .action(incrementActionMock).toMatchAction({ type: 'INCREMENT' })
    // should hide modal when state.count is even
    .reducer(multipleComponentsReducer).toMatchState({ count: 2, show: false })
    .view().contains(([ counter, modal ]) =>
      counter.contains(<div>{2}</div>) &&
      !modal.contains(<div className="showModal" />)
    )
  })
})
