import 'whatwg-fetch';
// import browserLanguage from 'get-browser-language';

import { Promise as P } from 'promise-polyfill';

import { h, render, Component } from 'preact';
import { Provider } from 'preact-redux';
import createHistory from 'history/createHashHistory';
import { Route, Switch, Redirect } from 'react-router';
import { ConnectedRouter, routerMiddleware } from 'react-router-redux';

import isIeSupported from './is-ie-supported';
import configureStore from '../redux/store/index';
// import globalNamespace from './globals-and-namespace';

export default () => {

  // TODO: show toast
  if (!isIeSupported()) return;

  // add promise support for browsers that are not supporting promises
  if (!global.Promise) {
    global.Promise = P;
  }

  // create namespace, returns env object
  // let env = globalNamespace(`_${STORAGE_KEY}`);

  // Create a history of your choosing
  const history = createHistory();

  // Build the middleware for intercepting and dispatching navigation actions
  const historyMiddleware = routerMiddleware(history);

  // get store
  let store = configureStore(historyMiddleware);

  // dispatch an action
  // store.dispatch({ type: 'UPDATE_PROGRAM_LANG', value: 'DK' });

  // log
  console.log(store.getState());

  class Home extends Component {

    render (props) {

      // log
      console.log(props);

      return (
        <div>
          <h1>Home</h1>
          <div>{JSON.stringify(props)}</div>
          <button onClick={this.onNavigate}>navigate</button>
        </div>
      );
    }

    // check https://stackoverflow.com/questions/39288915/detect-previous-path-in-react-router
    onNavigate = (ev) => {
      console.log(ev);
      this.props.store.dispatch({
        type: 'TOGGLE_DIRTY',
        value: '/'
      });
    }
  }

  class Settings extends Component {

    render (props) {

      // log
      // console.log(props);

      // get state from the props
      let store = { props };

      // log
      console.log(store);

      // dirty gateway
      for (let key in store.dirty) {
        if (store.dirty[key] === true && key !== store.router.location.pathname) {
          return <Redirect to={{
            pathname: key
          }} />;
        }
      }

      return (
        <div>
          <h1>Home</h1>
          <div>{JSON.stringify(props)}</div>
          <button onClick={this.onNavigate}>navigate</button>
        </div>
      );
    }

    // check https://stackoverflow.com/questions/39288915/detect-previous-path-in-react-router
    onNavigate = (ev) => {
      console.log(ev);
      this.props.store.dispatch({
        type: 'TOGGLE_DIRTY',
        value: '/'
      });
    }
  }

  /* const Settings = (props) => (
    <div>
      <h1>Settings</h1>
      <div>{JSON.stringify(props)}</div>
    </div>
  ); */

  /* ConnectedRouter will use the store from Provider automatically */
  render(
    <Provider store={store}>
      <ConnectedRouter history={history} >
        <Switch>
          <Route exact path='/' render={props => {

            // get current state
            let cState = store.getState();

            // log
            console.log(cState);

            return (
              <Home store={store} key1={'value1'} {...props} />
            );
          }} />
          {/* <Route path='/settings' component={Settings} /> */}
          <Route path='/settings' render={props => (
            <Settings store={store.getState()} key2={'value2'} {...props} />
          )} />
        </Switch>
      </ConnectedRouter>
    </Provider>,
    document.getElementById('app')
  );

  // hide spinner
  global._SmartPigs.spinner.hide();
};
