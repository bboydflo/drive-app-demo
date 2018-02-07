'use strict';

// exports
export default ($, utils) => {

  // returen edit number controller
  return function(newValue, options) {

    // log
    // console.log('edit number handler: ' + JSON.stringify(options));

    // get previous value
    var oldValue = this.revert;

    // check if new value is different from the old value
    if ( newValue == oldValue ) return newValue;

    // convert to number or NaN
    var numberValue = utils.toNumber( newValue );

    // if the new value is not numeric
    if ( !$.isNumeric( numberValue ) ) {

      // trigger error
      $.publish( 'update-error', [options.tableId, {
        oldValue: oldValue,
        newValue: newValue,
        iGroup: options.iGroup,
        iClick: options.iClick,
        rIndex: options.rIndex,
        cIndex: options.cIndex,
        rowId: options.rowId
      }] );

      // return previous value
      return oldValue;
    }

    // update value
    newValue = numberValue;

    // trigger update
    $.publish( 'update-view', [{
      tableId: options.tableId,
      rIndex: options.rIndex,
      cIndex: options.cIndex,
      iClick: options.iClick,
      iGroup: options.iGroup,
      rowId: options.rowId,
      oldValue: oldValue,
      newValue: newValue
    }] );

    // resume
    return newValue;
  };
};
