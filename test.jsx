import React from 'react';
import { shallow } from 'enzyme';

function Counter({ onClick, count }) {
  return (
    <div>
      <div>{count}</div>
      <button onClick={onClick}>increment</button>
    </div>
  );
}

function reduxTdd(s, render) {
  const state = { ...s };
  const wrapper = render(state);

  function view(newState) {
    const wrapper = render(newState);
    return {
      contains: (arg) => expect(wrapper.containsMatchingElement(arg)).toBeTruthy()
    }
  }

  function reducer(reducer, action) {
    const newState = reducer(state, action)
    return {
      toMatchObject: obj => {
        expect(newState).toMatchObject(obj)
        return {
          view: () => view(newState)
        }
      }
    }
  }

  function action(mockActionFn) {
    expect(mockActionFn).toHaveBeenCalled();
    const resultAction = mockActionFn();
    return {
      toMatchObject: obj => {
        expect(resultAction).toMatchObject(obj)
        return {
          reducer: r => reducer(r, resultAction)
        }
      }
    }
  }

  function simulate(fn) {
    const result = fn(wrapper)
    return {
      action
    }
  }

  return {
    simulate
  }
}

function incrementAction() {
  return {
    type: 'INCREMENT'
  }
}

function reducer(state, action) {
  return {
    count: 1
  }
}

const incrementActionMock = jest.fn(payload => incrementAction(payload))

describe('<Counter />', () => {
  it('should redux flow', () => {
    reduxTdd({ count: 0 }, state => shallow(<Counter onClick={incrementActionMock} count={state.count} />))
      .simulate(wrapper => wrapper.find('button').simulate('click'))
      .action(incrementActionMock).toMatchObject({ type: 'INCREMENT' })
      .reducer(reducer).toMatchObject({ count: 1 })
      .view().contains(1)
      // .view().toMatch(<span>1</span>);
  })
})
