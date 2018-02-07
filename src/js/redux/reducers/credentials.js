import { UPDATE_CREDENTIALS, UPDATE_CREDENTIALS_FIELD } from '../types';

let initialState = {
  /* database: '',
  databasePW: '',
  user: '',
  userPW: '' */
  database: 'highlightanimal',
  databasePW: '1234',
  user: 'fco',
  userPW: '1234'
};

export default (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_CREDENTIALS_FIELD:
      return Object.assign({}, state, {
        [action.payload.key]: action.payload.value
      });
    case UPDATE_CREDENTIALS:
      return Object.assign({}, state, action.payload.data);
    default:
      return state;
  }
};
