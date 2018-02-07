/**
 * Logs all actions and states after they are dispatched.
 */
const logger = ({ getState }) => next => action => {
  console.group(action.type);
  console.info('dispatching', action);
  let result = next(action);
  console.log('next state', getState());
  console.groupEnd(action.type);
  return result;
};

export default logger;
