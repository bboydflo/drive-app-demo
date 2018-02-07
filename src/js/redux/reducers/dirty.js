import { TOGGLE_DIRTY } from '../types';

export default (state = {}, action) => {
  switch (action.type) {
    case TOGGLE_DIRTY:
      return Object.assign({}, state, {
        [action.payload.url]: state[action.payload.url] ? !state[action.payload.value] : true
      });
    default:
      return state;
  }
};
