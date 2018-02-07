import browserLanguage from 'get-browser-language';

import {
  UPDATE_URL,
  UPDATE_LANG,
  UPDATE_SPINNER,
  UPDATE_MENU_TYPE,
  UPDATE_CONNECTION,
  UPDATE_DATE_FORMAT
} from '../types';

const initialUiState = {
  url: '',
  lang: 'US',
  locale: browserLanguage(),
  fadeIn: 100,
  fadeOut: 10,
  spinner: true,
  menuType: 0,
  connection: 1
};

export default (state = initialUiState, action) => {
  switch (action.type) {
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
