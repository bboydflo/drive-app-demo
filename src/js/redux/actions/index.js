// import Language from '../../modules/lang';
// import SmartPigsError from '../../modules/smartpigs-base-error';
// import Constants from '../../modules/constants';

import {
  UPDATE_URL,
  UPDATE_LANG,
  SERVER_REQUEST,
  TOGGLE_SPINNER,
  UPDATE_CREDENTIALS,
  UPDATE_CREDENTIALS_FIELD,
  UPDATE_SPINNER,
  THROW_ERROR,
  UPDATE_SESSION_DATA
} from '../types';
import { createAction } from 'redux-actions';

/**
 * navigate to action creater
 * @param {string} page - navigate to new url
 */
export const navigateAction = page => (dispatch, getState, { Backbone }) => {
  let cState = getState();
  console.log(cState);

  // dirty gateway
  // check that it is possible to navigate away from this page

  return dispatch({
    type: 'NAVIGATE_TO',
    payload: { page, Backbone }
  });
};

// login workflow
// check if all fields are filled -> spinner -> send request -> update store state -> navigate -> hide spinner
export const login = createAction(SERVER_REQUEST, null, payload => {
  if (payload.url) {
    return {
      throttle: true,
      json: true
    };
  }
});

export const throwError = createAction(THROW_ERROR);

export const updateUrl = createAction(UPDATE_URL);
export const updateLang = createAction(UPDATE_LANG);
export const toggleSpinner = createAction(TOGGLE_SPINNER);
export const updateSpinner = createAction(UPDATE_SPINNER);
export const updateCredentials = createAction(UPDATE_CREDENTIALS);
export const updateCredentialsField = createAction(UPDATE_CREDENTIALS_FIELD);

export const updateSessionData = createAction(UPDATE_SESSION_DATA);
