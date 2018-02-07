import { combineReducers } from 'redux';

import uiReducer from './ui';
import dirtyReducer from './dirty';
import errorsReducer from './errors';
import layoutsReducer from './layouts';
import androidReducer from './android';
import settingsReducer from './settings';
import credentialsReducer from './credentials';

export default combineReducers({
  ui: uiReducer,
  dirty: dirtyReducer,
  errors: errorsReducer,
  device: androidReducer,
  layouts: layoutsReducer,
  settings: settingsReducer,
  credentials: credentialsReducer
});
