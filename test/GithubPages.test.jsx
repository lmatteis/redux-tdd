import React from 'react';
import { shallow } from 'enzyme';
import { Observable } from 'rxjs';

import ReduxTdd from '../src/redux-tdd';

function items(state = [], action) {
  switch (action.type) {
    case 'REFRESH_DONE':
      return action.payload;
    default:
      return state
  }
}
function error(state = null, action) {
  switch (action.type) {
    case 'REFRESH_FAIL':
      return action.payload.error
    default:
      return state;
  }
}
function pages(state = { perPage: 2, selectedPage: 0 }, action) {
  switch (action.type) {
    case 'SELECT_PAGE':
      return { ...state, selectedPage: action.payload }
    default:
      return state
  }
}
function loading(state = false, action) {
  switch (action.type) {
    case 'REFRESH':
      return true
    case 'REFRESH_DONE':
      return false
    default:
      return state
  }
}

function List() {
  return <div />
}
function Loading() {
  return <div />
}
function Item() {
  return <div />
}
function RefreshButton() {
  return <div />
}
function Error() {
  return <div />
}
function Pages() {
  return <div />
}

function refreshAction() {
  return { type: 'REFRESH' };
}
function refreshDoneAction(payload) {
  return { type: 'REFRESH_DONE', payload };
}
function refreshFailAction(payload) {
  return { type: 'REFRESH_FAIL', payload, error: true };
}
function selectPageAction(pageIdx) {
  return { type: 'SELECT_PAGE', payload: pageIdx }
}

function handleRefreshEpic(action$, store, { getJSON }) {
  return action$.ofType('REFRESH')
    .mergeMap(() =>
      getJSON('http://foo.bar')
        .map(response => refreshDoneAction(response))
        .catch(err => Observable.of(refreshFailAction(err)))
    );
}

function getPages(state) {
  const numberOfPages = Math.floor(state.items.length / state.pages.perPage) + 1;
  var ret = []
  for (var i=0; i<numberOfPages; i++) {
    ret.push(i)
  }
  return ret;
}
function getItems(state) {
  return state.items.slice(
    state.pages.selectedPage * state.pages.perPage,
    (state.pages.selectedPage * state.pages.perPage) + state.pages.perPage
  )
}

describe('GithubPages', () => {
  ReduxTdd({ items, error, loading, pages }, state => [
    <List
      items={getItems(state)} />,
    <Loading
      loading={state.loading} />,
    <RefreshButton
      onClick={refreshAction} />,
    <Error
      message={state.error} />,
    <Pages
      pages={getPages(state)}
      onPageClick={selectPageAction} />
  ])
  .it('should not show any items')
    .contains(<Item />, false)

  .it('should click on refresh button')
    .switch(2) // RefreshButton
    .action(props => props.onClick())

  .it('should show loading')
    .switch(1) // Loading
    .toMatchProps({ loading: true })

  .it('should trigger a successful HTTP response')
    .epic(handleRefreshEpic, { getJSON: () =>
      Observable.of([
        { name: 'redux-tdd' }, { name: 'redux-cycles' }, { name: 'foo bar'}
      ])
    })

  .it('should show items based on the number of page selected')
    .switch(0)
    .toMatchProps({ items: [
      { name: 'redux-tdd' }, { name: 'redux-cycles' }
    ]})

  .it('should hide loading')
    .switch(1)
    .toMatchProps({ loading: false })

  .it('should render correct amount of pages')
    .switch(4)
    .toMatchProps({ pages: [0, 1] })

  .it('should select second page (index 1)')
    .action(props => props.onPageClick(1))

  .it('should show items based on second page')
    .switch(0)
    .toMatchProps({ items: [
      { name: 'foo bar' }
    ]})

  .it('should trigger an error response')
    .switch(2) // RefreshButton
    .action(props => props.onClick())
    .epic(handleRefreshEpic, { getJSON: () =>
      Observable.throw({ error: 'Some error' })
    })

  .it('should test that Error component got right error message')
    .switch(3)
    .toMatchProps({
      message: 'Some error'
    })


})
