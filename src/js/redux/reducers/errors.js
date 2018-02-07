import removeByKey from '../../modules/utils';

import {
  CREATE_ERROR,
  UPDATE_ERROR,
  REMOVE_ERROR,
  CLEAR_ALL_ERRORS
} from '../types';

export default (state = {}, action) => {
  switch (action.type) {
    case CREATE_ERROR:
    case UPDATE_ERROR:
      return Object.assign({}, state, {
        [action.payload.name]: action.payload.value
      });
    case REMOVE_ERROR:
      return removeByKey(state, action.payload.name);
    case CLEAR_ALL_ERRORS:
      return {};
    default:
      return state;
  }
};
