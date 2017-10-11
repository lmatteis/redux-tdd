import React from 'react';
import { shallow } from 'enzyme';
import { Observable } from 'rxjs';

import ReduxTdd, { props, contains } from '../src/redux-tdd-new';

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

describe('<GithubTrending />', () => {
  it('should test flow', () => {
    ReduxTdd({ github, error }, state => [
      <GithubTrending
        projects={state.github.projects}
        loading={state.github.loading}
        onRefresh={refreshAction} />
      ,
      <Error message={state.error.message} />
    ])
    .contains(<div className="loading" />, false)
    .contains(<div className="projects">No projects</div>)
    .contains(<button className="refresh">refresh</button>)

    .action(props => props.onRefresh())
    .toMatchProps({ loading: true })
    .contains(<div className="loading" />)

    .epic(handleRefreshEpic, { getJSON: () =>
      Observable.of([
        { name: 'redux-tdd' }, { name: 'redux-cycles' }
      ])
    })

    .toMatchProps({
      loading: false,
      projects: [{ name: 'redux-tdd' }, { name: 'redux-cycles' }]
    })

    .contains(<div className="loading" />, false) // shouldn't show loading
    .contains(<div className="projects">
      <div>redux-tdd</div>
      <div>redux-cycles</div>
    </div>)

    .action(props => props.onRefresh())
    .epic(handleRefreshEpic, { getJSON: () =>
      Observable.throw({ error: 'Some error' })
    })

    .toMatchProps({
      loading: false,
      projects: [],
    })
    .contains(<div className="projects">No projects</div>)

    .test(1)
    .toMatchProps({
      message: 'Some error'
    })
    .contains(<div className="error">{'Some error'}</div>)
  })
})
