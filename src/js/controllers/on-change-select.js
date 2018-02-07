'use strict';

// libs
import { getProp } from 'get-prop';

// exports
export default ( $ ) => {

  // return dropdown handler
  return ( newValue, options ) => {

    // get previous value
    var oldValue = this.revert;

    // check new value
    if ( getProp(options, ['data', newValue]) == oldValue ) {

      // toast
      // warning
    } else {

      // trigger update
      $.publish( 'update-view', [{
        tableId: options.tableId,
        rIndex: options.rIndex,
        cIndex: options.cIndex,
        rowId: options.rowId,
        iClick: options.iClick,
        oldValue: oldValue,
        newValue: parseInt(newValue)
      }] );
    }

    // resume
    // return options.data[newValue];
    return getProp(options, ['data', newValue]);
  };
};
