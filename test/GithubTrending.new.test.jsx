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

const initialState = { projects: [], loading: false };
function githubReducer(state = initialState, action) {
  switch (action.type) {
    case 'REFRESH':
      return { ...state, loading: true };
    case 'REFRESH_DONE':
      return { ...state, loading: false, projects: action.payload };
    default:
      return state;
  }
}

function handleRefreshEpic(action$, store, { getJSON }) {
  return action$.ofType('REFRESH')
    .mergeMap(() =>
      getJSON('http://foo.bar')
        .map(response => refreshDoneAction(response))
        .catch(err => Observable.of({ type: 'ERROR' }))
    );
}

describe('<GithubTrending />', () => {
  it('should test flow', () => {
    ReduxTdd({ projects: [], loading: false }, githubReducer, state => shallow(
      <GithubTrending
        projects={state.projects}
        loading={state.loading}
        onRefresh={refreshAction} />
    ))
    .contains(<div className="loading" />, false)
    .contains(<div className="projects">No projects</div>)
    .contains(<button className="refresh">refresh</button>)

    .action(wrapper =>
      wrapper.instance().props.onRefresh()
    )
    .contains(<div className="loading" />)
    .toMatchProps({ loading: true })

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
  })
})
