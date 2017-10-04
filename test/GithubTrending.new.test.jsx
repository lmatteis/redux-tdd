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
    .view(wrapper => {
      expect(wrapper.containsMatchingElement(<div className="loading" />)).toBeFalsy();
      expect(wrapper.containsMatchingElement(<div className="projects">No projects</div>)).toBeTruthy();
      expect(wrapper.containsMatchingElement(<button className="refresh">refresh</button>)).toBeTruthy();
    })

    .action(wrapper =>
      wrapper.instance().props.onRefresh()
    )
    .view(wrapper => {
      expect(props(wrapper)).toMatchObject({ loading: true })
      expect(contains(<div className="loading" />, wrapper)).toBeTruthy();
    })

    .epic(handleRefreshEpic, { getJSON: () =>
      Observable.of([
        { name: 'redux-tdd' }, { name: 'redux-cycles' }
      ])
    })
    .view(wrapper =>
      expect(props(wrapper)).toMatchObject({
        loading: false,
        projects: [{ name: 'redux-tdd' }, { name: 'redux-cycles' }]
      })
    )
    .view(wrapper => {
      expect(contains(<div className="loading" />, wrapper)).toBeFalsy(); // shouldn't show loading
      expect(contains(<div className="projects">
        <div>redux-tdd</div>
        <div>redux-cycles</div>
      </div>, wrapper)).toBeTruthy();

    })
  })
})
