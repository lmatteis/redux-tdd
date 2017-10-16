import React from 'react';
import { shallow } from 'enzyme';
import { Observable } from 'rxjs';

import ReduxTdd from '../src/redux-tdd-new';

function GithubTrending({ projects, loading, onRefresh }) {
  return <div>
    { loading && <div className="loading" /> }
    <div className="projects">
      { !projects.length && 'No projects' }
      { projects.map((p, idx) => <div key={idx}>{p.name}</div>) }
    </div>
    <button className="refresh" onClick={onRefresh}>refresh</button>
  </div>
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

const initialState = { projects: [], loading: false };
function github(state = initialState, action) {
  switch (action.type) {
    case 'REFRESH':
      return { ...state, loading: true };
    case 'REFRESH_DONE':
      return { ...state, loading: false, projects: action.payload };
    case 'REFRESH_FAIL':
      return { ...state, loading: false, projects: [] };
    default:
      return state;
  }
}

function handleRefreshEpic(action$, store, { getJSON }) {
  return action$.ofType('REFRESH')
    .mergeMap(() =>
      getJSON('http://foo.bar')
        .map(response => refreshDoneAction(response))
        .catch(err => Observable.of(refreshFailAction(err), setErrorAction(err)))
    );
}

function error(state = { message: null }, action) {
  switch (action.type) {
    case 'ERROR':
      return { ...state, message: action.payload.error }
    default:
      return state;
  }
}

function setErrorAction(error) {
  return { type: 'ERROR', payload: error };
}

function Error({ message }) {
  return <div className="error">{message}</div>
}

// const test = [
//   // by default let's work on first component in list
//   { op: 'contains', value: <div className="projects">No projects</div> },
//   { op: 'action', value: 'onRefresh' },
//   { op: 'toMatchProps', value: { loading: true } },
//   { op: 'contains', value: <div className="loading" /> },
//
//   { op: 'epic', value: {
//     dependency: 'getJSON',
//     output: Observable.of([
//       { name: 'redux-tdd' }, { name: 'redux-cycles' }
//     ])
//   } },
//
//   { op: 'toMatchProps', value: {
//     loading: false,
//     projects: [{ name: 'redux-tdd' }, { name: 'redux-cycles' }]
//   } },
//
// ]
// ReduxTdd({ github, error }, [ GithubTrending, Error ], test)

const actions = {
  clickRefreshBtn: props => props.onRefresh()
}

const props = {
  isLoading: { loading: true }
}

const views = {
  loading: <div className="loading" />,
  noProjects: <div className="projects">No projects</div>,
  refreshBtn: <button className="refresh">refresh</button>,
}

describe('<GithubTrending />', () => {
  ReduxTdd({ github, error }, state => [
    <GithubTrending
      projects={state.github.projects}
      loading={state.github.loading}
      onRefresh={refreshAction} />
    ,
    <Error message={state.error.message} />
  ])
  .it('should show no loading and no projects')
  .contains(views.loading, false)
  .contains(views.noProjects)
  .contains(views.refreshBtn)

  .it('should click refresh button and show loading')
  .action(actions.clickRefreshBtn)
  .toMatchProps(props.isLoading)
  .contains(views.loading)

  .it('should simulate http success and render response')
  .epic(handleRefreshEpic, { getJSON: () =>
    Observable.of([
      { name: 'redux-tdd' }, { name: 'redux-cycles' }
    ])
  })
  .toMatchProps({
    loading: false,
    projects: [{ name: 'redux-tdd' }, { name: 'redux-cycles' }]
  })
  .contains(views.loading, false) // shouldn't show loading
  .contains(<div className="projects">
    <div>redux-tdd</div>
    <div>redux-cycles</div>
  </div>)

  .it('should click refresh and simulate http error response')
  .action(actions.clickRefreshBtn)
  .epic(handleRefreshEpic, { getJSON: () =>
    Observable.throw({ error: 'Some error' })
  })
  .toMatchProps({
    loading: false,
    projects: [],
  })
  .contains(views.noProjects)

  .it('should test that Error component got right error message')
  .switch(1)
  .toMatchProps({
    message: 'Some error'
  })
  .contains(<div className="error">{'Some error'}</div>)
})
