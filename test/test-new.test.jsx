import React from 'react';
import { shallow } from 'enzyme';
import ReduxTdd, { props, toMatchProps, contains } from '../src/redux-tdd-new';

function Counter({ onIncrement, onReset, counter }) {
  return (
    <div>
      <div>{counter}</div>
      { counter === 10
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

function mapStateToProps(state) {
  return {
    counter: state.count
  }
}

describe('<Counter />', () => {
  it('should test increment', () => {
    ReduxTdd({ count: 0 }, reducer, props => ([
      <Counter
        onIncrement={incrementAction}
        onReset={resetAction}
        counter={props.count} />
    ]))
    .action(props => props.onIncrement())
    .toMatchProps({ counter: 1 })

    .action(props => props.onIncrement())
    .toMatchProps({ counter: 2 })
  })
  it('should test reset', () => {
    ReduxTdd({ count: 9 }, reducer, state => ([
      <Counter
        onIncrement={incrementAction}
        onReset={resetAction}
        counter={state.count} />
    ]))
    .action(props => props.onIncrement())
    .toMatchProps({ counter: 10 })
    .contains(<div>{10}</div>)

    .action(props => props.onReset())
    .toMatchProps({ counter: 0 })
    .contains(<div>{0}</div>)
  })
})

describe('<Counter /> and <Modal />', () => {
  it('should test interaction between multiple components', () => {
    ReduxTdd({ count: 0, show: false }, multipleComponentsReducer, state => ([
      <Counter
        onIncrement={incrementAction}
        counter={state.count} />
      ,
      <Modal
        show={state.show} />
    ]))

    // by default it works on the first component (Counter)
    .action((props) => props.onIncrement())
    .toMatchProps({ counter: 1 })
    .contains(<div>{1}</div>)

    .test(1)
      .toMatchProps({ show: true })
      .contains(<div className="showModal" />)

    .test(0)
      .action((props) => props.onIncrement())
      .toMatchProps({ counter: 2 })
      .contains(<div>{2}</div>)

    .test(1)
      .toMatchProps({ show: false })
      .contains(<div className="showModal" />, false)
  })
})
