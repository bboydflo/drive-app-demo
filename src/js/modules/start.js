import _ from 'underscore';
import { h, render } from 'preact';
import { Provider } from 'preact-redux';

import * as gapiDemo from '../modules/google-auth-demo';

// import App from '../components/app';
import App from '../pages/app';
import Backbone from '../vendor/my-backbone-router';
import configureStore from '../redux/store';
import AppRouterFactory from '../routes/global';

// import { STORAGE_KEY, UPDATE_URL } from '../redux/types';
import { STORAGE_KEY, SIGNED_IN } from '../redux/types';

export default () => {
  var stateParam;
  try {
    stateParam = JSON.parse(decodeURIComponent(location.search.slice(7)));
  } catch (e) {
    console.log(e);
  }

  let initialState;
  try {

    // get initial state from local storage
    initialState = JSON.parse(localStorage.getItem(STORAGE_KEY + '.root')) || {};
  } catch (e) {

    // development
    if (process.env.development) {
      console.log(e);
    }
    initialState = null;
  }

  let store = configureStore(STORAGE_KEY, initialState, Backbone);

  // isChrome support
  try {
    if (chrome && chrome.app.isInstalled) {
      store.dispatch({ type: 'IS_APP_INSTALLED' });
    }
  } catch (e) {
    console.log('not chrome');
  }

  // TODO: check backup.SmartPigs local storage key and
  // dispatch actions to update the store with backup values

  // store.dispatch({ type: 'UPDATE_APP_CACHE' });

  if (stateParam && stateParam.ids && stateParam.ids.length === 1) {
    store.dispatch({
      type: 'UPDATE_FILE_ID',
      payload: stateParam.ids[0]
    });
  }

  // create app router
  const AppRouter = AppRouterFactory(_, Backbone);

  gapiDemo.handleClientLoad(() => {
    gapiDemo
      .initClient()
      .then(() => {
        store.dispatch({
          type: SIGNED_IN,
          payload: gapi.auth2.getAuthInstance().isSignedIn.get()
        });

        // listen for sign in changes
        gapiDemo.listenForSignInChanges(() => {
          store.dispatch({
            type: SIGNED_IN,
            payload: gapi.auth2.getAuthInstance().isSignedIn.get()
          });
        });

        render(
          <Provider store={store}>
            <App Router={AppRouter} />
          </Provider>,
          document.getElementById('app')
        );

        store.dispatch({ type: 'HIDE_SPINNER' });
      });
  });
};
