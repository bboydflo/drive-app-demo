import _ from 'underscore';
import { h, render } from 'preact';
import { Provider } from 'preact-redux';

// import App from '../components/app';
import App from '../pages/app';
import Backbone from '../vendor/my-backbone-router';
import isIeSupported from './is-ie-supported';
import configureStore from '../redux/store';
import AppRouterFactory from '../routes/global';

import { STORAGE_KEY } from '../redux/types';

export default () => {

  // TODO: show toast
  if (!isIeSupported()) return;

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

  // TODO: check backup.SmartPigs local storage key and
  // dispatch actions to update the store with backup values

  // store.dispatch({ type: 'UPDATE_APP_CACHE' });

  // create app router
  const AppRouter = AppRouterFactory(_, Backbone);

  render(
    <Provider store={store}>
      <App Router={AppRouter} />
    </Provider>,
    document.getElementById('app')
  );

  store.dispatch({ type: 'HIDE_SPINNER' });
};
