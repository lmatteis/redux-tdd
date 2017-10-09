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

// describe('<Counter />', () => {
//   it('should test increment', () => {
//     ReduxTdd({ count: 0 }, reducer, props => shallow(
//       <Counter
//         onIncrement={incrementAction}
//         onReset={resetAction}
//         counter={props.count} />
//     ), mapStateToProps)
//     .action(wrapper =>
//       wrapper.instance().props.onIncrement()
//     )
//     .view(wrapper =>
//       expect(wrapper.instance().props.counter).toBe(1)
//     )
//     .action(wrapper =>
//       wrapper.instance().props.onIncrement()
//     )
//     .view(wrapper =>
//       expect(wrapper.instance().props).toMatchObject({ counter: 2 })
//     )
//   })
//   it('should test reset', () => {
//     ReduxTdd({ count: 9 }, reducer, state => shallow(
//       <Counter
//         onIncrement={incrementAction}
//         onReset={resetAction}
//         count={state.count} />
//     ))
//     .action(wrapper =>
//       wrapper.instance().props.onIncrement()
//     )
//     .view(wrapper => {
//       expect(props(wrapper)).toMatchObject({ count: 10 })
//       expect(wrapper.contains(<div>{10}</div>)).toBeTruthy()
//     })
//
//     .action(wrapper =>
//       wrapper.instance().props.onReset()
//     )
//     .view(wrapper => {
//       expect(props(wrapper)).toMatchObject({ count: 0 })
//       expect(wrapper.contains(<div>{0}</div>)).toBeTruthy()
//     })
//   })
// })

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

    .action(([ counterWrapper, modalWrapper ]) =>
      props(counterWrapper).onIncrement() // simulate a click
    )
    // should show modal when state.count is odd
    .view(() => ([
      [
        toMatchProps({ counter: 1 }),
        contains(<div>{1}</div>)
      ],
      [
        toMatchProps({ show: true }),
        contains(<div className="showModal" />)
      ]
    ]))
    // .action(([ counterWrapper, modalWrapper ]) =>
    //   counterWrapper.instance().props.onIncrement() // simulate a click
    // )
    // .view(([ counter, modal ]) =>
    //   expect(counter.contains(<div>{2}</div>) &&
    //   !modal.contains(<div className="showModal" />)).toBeTruthy()
    // )
  })
})
