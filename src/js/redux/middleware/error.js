import { THROW_ERROR } from '../types';
import { throwError } from '../actions';
/**
 * throw app errors
 * TODO: should be able to enable/disable error bubling
 */
const error = ({ getState }) => next => action => {
  let { type } = action;
  if (type === THROW_ERROR) {
    let result = next(throwError(action));
    return result;
  }
  return next(action);
};

export default error;
