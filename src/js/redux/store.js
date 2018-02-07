// check: https://github.com/reactjs/redux/tree/master/examples/todomvc
// check: https://github.com/michaelcontento/redux-storage
// https://github.com/HelpfulHuman/Redux-Session
import { createStore, applyMiddleware, compose } from 'redux';
// import { createSession } from 'redux-session';
import thunk from 'redux-thunk';
import rootReducer from './reducers/index';
import logger from './middleware/log';
import syncUrl from './middleware/sync-url';
import spinner from './middleware/spinner';
import api from './middleware/api';
import appcache from './middleware/appcache';

export default function configureStore (STORAGE_KEY, initialState, Backbone) {

  /* // middleware to save state into local storage
  const sessionMiddleware = createSession({
    ns: STORAGE_KEY,
    throttle: 1500 // update storage once every 1.5 seconds
    // onLoad: (storedState, dispatch) => {
    //   console.log(storedState);
    //   dispatch({ type: 'HYDRATE_STATE', storedState });
    // }
  }); */

  console.log('TODO: add toastr middleware');

  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  const enhancer = composeEnhancers(
    applyMiddleware(
      logger,
      appcache,
      // sessionMiddleware,
      thunk.withExtraArgument({ Backbone }),
      syncUrl,
      spinner,
      api
    )
    // other store enhancers if any
  );

  // create store
  return createStore(rootReducer, initialState, enhancer);
}
