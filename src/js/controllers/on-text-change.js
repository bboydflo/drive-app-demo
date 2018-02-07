'use strict';

// exports
export default ($, utils, getCellInfo) => {

  // return event handler method
  return function(event) {

    // get element target
    var $target = $( event.currentTarget );

    // get cell info
    var cellInfo = getCellInfo( event );

    // get keyvoade
    var keycode = ( event.keyCode ? event.keyCode : event.which );

    // on enter (+ on tab, keycode == 9, or event.type == 'focusout')
    if ( keycode == 13 || event.type == 'change' ) {

      // get row id
      var rowId  = cellInfo.rowId;
      var rIndex = cellInfo.rIndex;
      var cIndex = cellInfo.cIndex;

      // get table model
      var tModel = this.model.toJSON();

      // get column type (1 or 2) (one method is more precise and more scalable)
      // var iClick = cellInfo.type == 'number' ? 1 : 2;
      var iClick = tModel.tHead[tModel.properties.lastHeaderIdx].th[cIndex].iClick;

      // get iGroup
      var iGroup = tModel.tHead[tModel.properties.lastHeaderIdx].th[cIndex].iGroup;

      // old value
      var oldValue = tModel.tRows[rIndex].data[cIndex];

      // new value
      var newValue = cellInfo.currentVal;

      // if number type compare old value, but with cut decimals with the current value
      if ( cellInfo.type == 'number' ) {

        // convert to number or NaN
        var numberValue = utils.toNumber( newValue );

        // if the new value is not numeric
        if ( newValue && !$.isNumeric( numberValue ) ) {

          // trigger error
          $.publish( 'update-error', [tModel.tId, {
            rowId: rowId,
            rIndex: rIndex,
            cIndex: cIndex,
            iClick: iClick,
            iGroup: iGroup,
            tableId: tModel.tId,
            oldValue: oldValue,
            newValue: newValue
          }] );

          // resume
          return false;
        }

        // update old value
        newValue = utils.cutDecimals( newValue, 2 );
      }

      // cell type is select and iClick == 5
      if ( event.type == 'change' && iClick == 5 ) {

        // update new value
        newValue = parseInt( newValue, 10 );
      }

      // nothing changed -> resume
      if ( oldValue == newValue ) return;

      // trigger update
      $.publish( 'update-view', [{
        rowId: rowId,
        rIndex: rIndex,
        cIndex: cIndex,
        iClick: iClick,
        iGroup: iGroup,
        tableId: tModel.tId,
        oldValue: oldValue,
        newValue: newValue
      }] );
    }

    // check input value and type
    if ( typeof cellInfo.currentVal !== 'undefined' ) {

      // apply caret plugin
      $target.caret( cellInfo.currentVal.length );
    }

    // resume
    // prevent event propagation + event default handler
    return false;
  };
};
