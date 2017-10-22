import React from 'react';
import { shallow } from 'enzyme';
import ReduxTdd from '../src/redux-tdd';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/map';

function fetchItems() {
  return { type: 'FETCH_ITEMS' }
}

function recievedItems(payload) {
  return { type: 'RECIEVED_ITEMS', payload }
}
function pauseItem(id) {
  return { type: 'PAUSE_ITEM', payload: id }
}

function handleFetchItems(action$, store, { getJSON }) {
  return action$
    .switchMap(action =>
      getJSON('http://foo')
        .map(response =>
          response.reduce((acc, curr) =>
            ({
              ...acc,
              [curr.id]: curr,
            })
          , {})
        )
        .map(response => recievedItems(response))
    )
}

function Pause({ id, onClick }) {
  return <a href="#" onClick={onClick}>pause</a>
}
function Item({ item }) {
  return <div>
    <Pause id={item.id} />
  </div>
}
function Items({ items }) {
  return <div>
    {Object.keys(items).map(id => <Item key={id} item={items[id]} />)}
  </div>
}

// items: { id -> item }
function items(state = {}, action) {
  switch (action.type) {
    case 'RECIEVED_ITEMS':
      return action.payload;
    case 'PAUSE_ITEM':
      return {
        ...state,
        [action.payload]: {
          ...state[action.payload],
          status: 'paused'
        }
      }
    default:
      return state;
  }
}
describe('Items and Item', () => {
  const response = [
    { id: 1, name: 'Foo', date: 'March' },
    { id: 2, name: 'Bar', date: 'November' }
  ]
  ReduxTdd({ items }, state => ([
    <Items
      items={state.items}
      fetchItems={fetchItems}
      />
    ,
    <Item
      item={state.items['1'] || {}}
      />
    ,
    <Pause
      id={'1'} onClick={pauseItem}
      />
  ]))

  .it('should load items')
    .action(props => props.fetchItems())
    .epic(handleFetchItems, { getJSON: () =>
      Observable.of(response)
    })
    .toMatchProps({ items:
      {
        1: { id: 1, name: 'Foo', date: 'March' },
        2: { id: 2, name: 'Bar', date: 'November' }
      }
    })

  .switch(Item)
    .toMatchProps({ item:
      { id:1, name: 'Foo', date: 'March' }
    })

  .switch(Pause)
    .action(props => props.onClick(1)) // pause item with id 1

  .switch(Item)
    .toMatchProps({ item:
      { id: 1, name: 'Foo', date: 'March', status: 'paused' }
    })
})
