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

  // inline app installation support
  try {
    if (chrome && chrome.app.isInstalled) {
      store.dispatch({ type: 'IS_APP_INSTALLED' });
    }
  } catch (e) {
    store.dispatch({ type: 'IS_APP_INSTALLED' });
  }

  // create app router
  const AppRouter = AppRouterFactory(_, Backbone);

  // TODO: google api loading should be synchronous
  gapiDemo.handleClientLoad(() => {
    gapiDemo
      .initClient()
      .then(() => {
        let signedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
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

        try {
          let fileId;
          let stateParam = JSON.parse(decodeURIComponent(location.search.slice(7)));
          if (stateParam && stateParam.ids && stateParam.ids.length === 1) {
            fileId = stateParam.ids[0];
            store.dispatch({
              type: 'UPDATE_FILE_ID',
              payload: fileId
            });

            // file id but not signed in
            if (!signedIn) {
              gapiDemo.signIn();
            }
          }
        } catch (e) {
          console.log(e);
        }

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
