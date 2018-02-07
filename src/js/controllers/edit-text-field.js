'use strict';

// exports
export default ($) => {

  // return new function
  return function(newValue, options) {

    // log
    console.log('edit text handler: ' + JSON.stringify(options));

    // get previous value
    var oldValue = this.revert;

    // if value changed
    if ( newValue == oldValue ) return newValue;

    // trigger update
    $.publish( 'update-view', [{
      tableId: options.tableId,
      rIndex: options.rIndex,
      cIndex: options.cIndex,
      rowId: options.rowId,
      iClick: options.iClick,
      iGroup: options.iGroup,
      oldValue: oldValue,
      newValue: newValue
    }] );

    // resume
    return newValue;
  };
};
