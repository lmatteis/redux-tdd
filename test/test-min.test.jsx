import React from 'react';
import { shallow } from 'enzyme';
import ReduxTdd from '../src/redux-tdd-min';

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
    ReduxTdd({ count: 0 }, reducer, state => shallow(
      <Counter
        onIncrement={incrementAction}
        onReset={resetAction}
        count={state.count} />
    ))
    .action(wrapper =>
      wrapper.instance().props.onIncrement()
    )
    .toMatchState({ count: 1 })
    .view().contains(<div>{1}</div>)
    .toMatchState({ count: 2 })
    .view().contains(<div>{2}</div>)
  })
  it('should test reset', () => {
    ReduxTdd({ count: 9 }, reducer, state => shallow(
      <Counter
        onIncrement={incrementAction}
        onReset={resetAction}
        count={state.count} />
    ))
    .action(wrapper =>
      wrapper.instance().props.onIncrement()
    )
    .toMatchState({ count: 10 })
    .view().contains(<div>{10}</div>)

    .action(wrapper =>
      wrapper.instance().props.onReset()
    )
    .toMatchState({ count: 0 })
  })
})

describe('<Counter /> and <Modal />', () => {
  it('should test interaction between multiple components', () => {
    ReduxTdd({ count: 0, show: false }, multipleComponentsReducer, state => ([
      shallow(
        <Counter
          onIncrement={incrementAction}
          counter={state.count} />
      ),
      shallow(
        <Modal
          show={state.show} />
      )
    ]))
    .action(([ counterWrapper, modalWrapper ]) =>
      counterWrapper.instance().props.onIncrement() // simulate a click
    )
    // should show modal when state.count is odd
    .toMatchState({ count: 1, show: true })
    .view().contains(([ counter, modal ]) =>
      counter.contains(<div>{1}</div>) &&
      modal.contains(<div className="showModal" />)
    )
    .action(([ counterWrapper, modalWrapper ]) =>
      counterWrapper.instance().props.onIncrement() // simulate a click
    )
    // should hide modal when state.count is even
    .toMatchState({ count: 2, show: false })
    .view().contains(([ counter, modal ]) =>
      counter.contains(<div>{2}</div>) &&
      !modal.contains(<div className="showModal" />)
    )
  })
})
