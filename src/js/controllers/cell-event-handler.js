'use strict';

// exports
export default ($, session, Language, getCellInfo) => {

  // return table cell event handler
  return function(event) {

    // view vars
    var isEditableRow, iGroup, iClick, bReadOnly,
      isReadOnlyColumn, lastColIndex, checkmarkState,
      evOptions = {};

    // get event source. event.currentTarget reffers to tbody element
    // target = $( event.target );
    var $target = $( event.currentTarget );

    // cell is already in edit mode (contains a form) -> resume
    // if ( $target.find( 'form' ).length || $target.find('input').length ) {
    if ( $target.find( 'form' ).length ) {

      // resume
      // check: https://stackoverflow.com/questions/1357118/event-preventdefault-vs-return-false/1357151#1357151
      return false;
    }

    // cell info
    var cellInfo = getCellInfo( event );

    // cache $row and $col elements
    var $row   = $target.closest( 'tr' );
    var rowId  = cellInfo.rowId;
    var rIndex = cellInfo.rIndex;
    var cIndex = cellInfo.cIndex;

    // get current app lang
    var lang = session.get( 'settings', 'lang' );

    // get table model
    var tModel = this.model.toJSON();

    // get row by id
    var tRow = this.getRowsBy( 'id', rowId, true );

    // validate row (not necessary)
    if ( !tRow ) {

      // prevent default and resume
      // event.preventDefault();
      // event.stopPropagation();

      // toast and resume
      $.publish( 'toast', [2, 'SmartPigs Error: table row with id = ' + rowId + ' could not be found @TableCellEventHandler()!'] );

      // resume
      // check: https://stackoverflow.com/questions/1357118/event-preventdefault-vs-return-false/1357151#1357151
      return false;
    }

    // get column type
    iClick = tModel.tHead[tModel.properties.lastHeaderIdx].th[cIndex].iClick;

    // check if table view has checkmark row
    if ( tModel.tCheck ) {

      // on enter (open sowcard by number)
      if ( iClick == 13 ) {

        // should open sowcard
        return this.trigger('open-card', { number: tRow.getValue(cIndex) });
      }

      // get checkmark state
      checkmarkState = 1 - tRow.check();

      // checkmark state
      var faClass = checkmarkState ? 'fa-check-square-o' : 'fa-square-o';

      // check index
      if ( cIndex ) {

        // get flag
        isReadOnlyColumn = tModel.tHead[tModel.properties.lastHeaderIdx].th[cIndex].bReadOnly;

        // check flag
        if ( isReadOnlyColumn ) {

          // toggle check
          tRow.check( checkmarkState );

          // update row
          if ( !this.updateRowBy( 'id', rowId, tRow ) ) {

            // toast
            $.publish( 'toast', [2, 'Could not toggle row!'] );

            // resume
            // check: https://stackoverflow.com/questions/1357118/event-preventdefault-vs-return-false/1357151#1357151
            return false;
          }

          // trigger check event and resume
          this.trigger('toggle-check', {
            rowId: rowId,
            rIndex: rIndex,
            tableId: tModel.tId,
            checked: checkmarkState
          });

          // find checkbox input
          $row.find('td:first i').removeClass().addClass('fa ' + faClass);

          // resume
          // check: https://stackoverflow.com/questions/1357118/event-preventdefault-vs-return-false/1357151#1357151
          return false;
        }
      }
    }

    // log
    // console.log('table cell event handler, iClick = ' + iClick + ', ' + JSON.stringify(cellInfo));

    // if has extra columns
    if ( tModel.tExtra ) {

      // update last column index
      lastColIndex = tModel.properties.lastHeaderLength - 2;
    }

    // check if column index is less then or equal than table row data length
    if ( cIndex == lastColIndex ) {

      // trigger check event and resume
      return this.trigger('remove-row', {
        rowId: rowId,
        rIndex: rIndex,
        tableId: tModel.tId
      });
    }

    // get column type
    iClick = tModel.tHead[tModel.properties.lastHeaderIdx].th[cIndex].iClick;

    // get column read only flag
    isReadOnlyColumn = typeof bReadOnly == 'undefined' ? tModel.tHead[tModel.properties.lastHeaderIdx].th[cIndex].bReadOnly : isReadOnlyColumn;

    // get row editable flag
    isEditableRow = tModel.tRows[rIndex].editable;

    // should edit view
    if ( !isEditableRow || isReadOnlyColumn ) {

      // check column type
      if ( iClick !== 9 && iClick !== 8 ) {

        // prevent default event and stop event propagation
        event.preventDefault();
        event.stopPropagation();

        // toast msg
        var toastMsg = session.get( 'sp_lang', 'SP_ModalsBody7') || Language.modals.body7[lang];

        // toast and resume
        $.publish( 'toast', [2, toastMsg] );

        // resume
        // check: https://stackoverflow.com/questions/1357118/event-preventdefault-vs-return-false/1357151#1357151
        return false;
      }
    }

    // get iGroup
    iGroup = tModel.tHead[tModel.properties.lastHeaderIdx].th[cIndex].iGroup;

    // build event options
    evOptions.tEvent    = event.type;
    evOptions.rowId     = rowId;
    evOptions.rIndex    = rIndex;
    evOptions.cIndex    = cIndex;
    evOptions.rEditable = isEditableRow;
    evOptions.cEditable = !isReadOnlyColumn;
    evOptions.iClick    = iClick;
    evOptions.iGroup    = iGroup;
    evOptions.tableId   = tModel.tId;

    // hide datepicker event
    if ( evOptions.tEvent == 'hide' ) {

      // if date changed
      if ( event.format() !== '' ) {
        evOptions.newValue = event.format();
      } else {
        evOptions.newValue = event.target.innerHTML;
      }

      // update date
      $target.text( evOptions.newValue );

      // update event with 'oldValue' attribute
      evOptions.oldValue = tModel.tRows[evOptions.rIndex].data[evOptions.cIndex];

      // check if new value is different from the old value
      if ( evOptions.oldValue == evOptions.newValue ) return;

      // trigger update
      $.publish( 'update-view', [evOptions] );

      // resume
      return;
    }

    // contextmenu or taphold support
    if ( evOptions.tEvent == 'contextmenu' || evOptions.tEvent == 'taphold' ) {

      // prevent default event and stop event propagation
      event.preventDefault();
      event.stopPropagation();
    }

    // publish event to interested modules
    this.trigger( 'edit-table', evOptions );
  };
};
