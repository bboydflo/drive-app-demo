'use strict';

// exports
export default ($) => {

  // return event handler method
  return (event) => {

    // get target
    var $target = $( event.currentTarget );

    // get current value
    var currentVal = $target.val();

    // get input type
    var type = $target.attr( 'type' );

    // cache $row and $col elements
    var $row = $target.closest( 'tr' );
    var $col = $target.closest( 'td' );

    // always subtract 1 because we added
    // an artificial row called for scrolling purposes
    var rIndex = $row.index() - 1;
    var cIndex = $col.index();
    var rowId  = $row.data( 'rowid' );

    // resume
    return {
      // ev: event,
      type: type,
      rowId: rowId,
      rIndex: rIndex,
      cIndex: cIndex,
      currentVal: currentVal
    };
  };
};
