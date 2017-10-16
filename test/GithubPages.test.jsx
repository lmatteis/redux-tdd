import React from 'react';
import { shallow } from 'enzyme';
import { Observable } from 'rxjs';

import ReduxTdd from '../src/redux-tdd-new';

function items(state, action) {
  return {
  }
}
function error(state, action) {
  return {};
}
function pages(state, action) {
  return {}
}
function loading(state, action) {
  switch (action.type) {
    case 'REFRESH':
      return true
    default:
      return false
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
  return { type: 'REFRESH' }
}
function pageClickAction() {
  return {}
}

function handleRefreshEpic(action$, store, { getJSON }) {
  return action$.ofType('REFRESH')
    .mergeMap(() =>
      getJSON('http://foo.bar')
        .map(response => refreshDoneAction(response))
        .catch(err => Observable.of(refreshFailAction(err), setErrorAction(err)))
    );
}

describe('GithubPages', () => {
  ReduxTdd({ items, error, pages, loading }, state => [
    <List
      items={state.items} />,
    <Loading
      loading={state.loading} />,
    <RefreshButton
      onClick={refreshAction} />,
    <Error
      message={state.error} />,
    <Pages
      pages={state.pages}
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


})
