import React from 'react';
import { shallow } from 'enzyme';
import reduxTdd from '../src/redux-tdd';

const TodoList = ({ listItems }) =>
  <div>
    {listItems.map(i => <div key={i}>{i}</div>)}
  </div>

const AddTodo = ({ onAdd }) =>
  <button onClick={onAdd}>add todo</button>

function addTodo(todoText) {
  return { type: 'ADD_TODO', payload: todoText }
}

function list(state = {}, action) {
  switch (action.type) {
    case 'ADD_TODO':
      return { ...state, [action.payload]: {} }
    default:
      return state
  }
}

function getVisibleItems(state) {
  return Object.keys(state.list).length
    ? Object.keys(state.list).map(key => key)
    : []
}

describe('TodoList', () => {
  reduxTdd({ list }, state => [
    <TodoList listItems={getVisibleItems(state)} />,
    <AddTodo onAdd={addTodo} />
  ])
  .it('should add a todo item')
  .switch(AddTodo) // the next dot-chained calls will work on AddTodo
  .action(props => props.onAdd('clean house')) // add 'clean house'

  .switch(TodoList) // back to TodoList
  .toMatchProps({ listItems: ["clean house"] })

  .switch(AddTodo).action(props => props.onAdd('water plants'))
  .switch(TodoList).toMatchProps({ listItems: [
    "clean house",
    "water plants"
  ]})
})
