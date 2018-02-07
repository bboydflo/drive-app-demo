import { TOGGLE_SPINNER, HIDE_SPINNER, SHOW_SPINNER } from '../types';
import { updateSpinner } from '../actions';

/**
 * show/hide or toggle spinner
 */
const spinner = ({ getState }) => next => action => {
  let { type } = action;
  if (type === TOGGLE_SPINNER || type === HIDE_SPINNER || type === SHOW_SPINNER) {
    let cState = getState();
    let isSpinning = cState.ui.spinner;
    if (action.type === TOGGLE_SPINNER) {
      isSpinning = !isSpinning;
    }
    if (action.type === HIDE_SPINNER) {
      isSpinning = false;
    }
    if (action.type === SHOW_SPINNER) {
      isSpinning = true;
    }

    // show/hide spinner
    isSpinning ? global._SmartPigs.spinner.show() : global._SmartPigs.spinner.hide();

    return next(updateSpinner(isSpinning));
  }

  return next(action);
};

export default spinner;
