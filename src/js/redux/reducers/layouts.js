import { RESET_SESSION_DATA, UPDATE_SESSION_DATA } from '../types';

let initialState = {
  sessionKey: '',
  // dateFormat: 'dd-mm-yyyy',
  // update default date format in order to accomodate the new formatting library
  dateFormat: 'dd-MM-yyyy',
  texts: '',
  title: '',
  loginType: 0,
  left: {
    items: []
  },
  center: {
    items: []
  },
  right: {
    items: []
  },
  nested: {
    items: []
  }
};

export default (state = initialState, action) => {
  switch (action.type) {
    case RESET_SESSION_DATA:
      return initialState;
    case UPDATE_SESSION_DATA:
      return Object.assign({}, state, action.payload);
    default: return state;
  }
};
