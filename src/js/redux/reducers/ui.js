import browserLanguage from 'get-browser-language';

import {
  SIGNED_IN,
  UPDATE_URL,
  UPDATE_LANG,
  UPDATE_FILE_ID,
  UPDATE_SPINNER,
  IS_APP_INSTALLED,
  UPDATE_MENU_TYPE,
  UPDATE_CONNECTION,
  UPDATE_DATE_FORMAT
} from '../types';

const initialUiState = {
  url: '',
  lang: 'US',
  fileId: null,
  locale: browserLanguage(),
  fadeIn: 100,
  fadeOut: 10,
  spinner: true,
  menuType: 0,
  signedIn: false,
  connection: 1,
  isAppInstalled: false
};

export default (state = initialUiState, action) => {
  switch (action.type) {
    case UPDATE_FILE_ID:
      return Object.assign({}, state, { fileId: action.payload });
    case IS_APP_INSTALLED:
      return Object.assign({}, state, { isAppInstalled: true });
    case SIGNED_IN:
      return Object.assign({}, state, { signedIn: action.payload });
    case UPDATE_LANG:
      return Object.assign({}, state, { lang: action.payload });
    case UPDATE_DATE_FORMAT:
      return Object.assign({}, state, { dateFormat: action.payload });
    case UPDATE_MENU_TYPE:
      return Object.assign({}, state, { menuType: action.payload });
    case UPDATE_CONNECTION:
      return Object.assign({}, state, { connection: action.payload });
    case UPDATE_URL:
      return Object.assign({}, state, { url: action.payload });
    case UPDATE_SPINNER:
      return Object.assign({}, state, { spinner: action.payload });
    default:
      return state;
  }
};
