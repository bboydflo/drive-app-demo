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

import pdfjsLib from 'pdfjs-dist';

export default () => {

  // Setting worker path to worker bundle.
  pdfjsLib.PDFJS.workerSrc = './src/js/vendor/pdf.worker.js';

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

  // defaults
  let fileId;
  var signedIn = false;

  try {
    let stateParam = JSON.parse(decodeURIComponent(location.search.slice(7)));
    if (stateParam && stateParam.ids && stateParam.ids.length === 1) {
      fileId = stateParam.ids[0];
      store.dispatch({
        type: 'UPDATE_FILE_ID',
        payload: fileId
      });
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

  // hide spinner
  store.dispatch({ type: 'HIDE_SPINNER' });

  // TODO: google api loading should be synchronous
  gapiDemo.handleClientLoad(() => {
    gapiDemo
      .initClient()
      .then(() => {
        signedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
        store.dispatch({
          type: SIGNED_IN,
          payload: signedIn
        });

        gapiDemo.listenForSignInChanges(() => {
          let isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
          store.dispatch({
            type: SIGNED_IN,
            payload: isSignedIn
          });
          if (isSignedIn) {

            // create picker
            gapiDemo.createPicker();
          }
        });

        if (!signedIn) {
          return gapiDemo.signIn();
        }

        if (fileId) {
          let accessToken = gapiDemo.getAccessToken();
          let pdfUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${accessToken}`;
          let loadingTask = pdfjsLib.getDocument(pdfUrl);

          // TODO: dispatch action with pdfDocument as payload
          loadingTask.promise.then(pdfDocument => {

            // request the first page only
            return pdfDocument.getPage(1).then(pdfPage => {

              // Display page on the existing canvas with 100% scale.
              var viewport = pdfPage.getViewport(1.0);
              var canvas = document.getElementById('the-canvas');

              canvas.width = viewport.width;
              canvas.height = viewport.height;
              // canvas.width = 640;
              // canvas.height = 480;

              var ctx = canvas.getContext('2d');
              var renderTask = pdfPage.render({
                canvasContext: ctx,
                viewport: viewport
              });
              return renderTask.promise;
            });
          }).catch(function (reason) {
            console.error('Error: ' + reason);
          });
        }
      });
  });
};
