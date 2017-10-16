import React from 'react';
import { shallow } from 'enzyme';
import { Observable } from 'rxjs';

import ReduxTdd from '../src/redux-tdd-new';

function items(state = [], action) {
  switch (action.type) {
    case 'REFRESH_DONE':
      return action.payload;
    default:
      return state
  }
}
function error(state, action) {
  return {};
}
function pages(state, action) {
  return {}
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
function pageClickAction() {
  return {}
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
  return state.items.map((item, idx) => idx)
}

describe('GithubPages', () => {
  ReduxTdd({ items, error, loading }, state => [
    <List
      items={state.items} />,
    <Loading
      loading={state.loading} />,
    <RefreshButton
      onClick={refreshAction} />,
    <Error
      message={state.error} />,
    <Pages
      pages={getPages(state)}
      onPageClick={pageClickAction} />
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
      { name: 'redux-tdd' }, { name: 'redux-cycles' }
    ])
  })

  .it('should show projects')
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


})
