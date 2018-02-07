'use strict';

// libs
import getProp from 'get-prop';

// lodash functions
import { isArray, trimStart } from 'lodash';

// singleton vars
var log;

// create worktask view by extending base view
export default ($, debug, Language, Const, WorkTask) => {

  // return worktask list view
  return class V extends WorkTask {

    // overwrite parent method
    initialize(opt) {

      // init log
      log = debug( 'WorkTaskList' );

      // call parent initialize
      WorkTask.prototype.initialize.call( this, opt );
    }

    /**
     * on reader result
     * @param  {[type]} event   [description]
     * @param  {[type]} options [description]
     * @return {[type]}         [description]
     */
    onReaderResult(ev, attr, value) {
      var tRow, dialog, formView,
        _self      = this,
        // animals    = [],
        // readerMode = Const.SINGLE_MODE,
        table      = this.getView( '.main-component' ),
        layout     = this.model.get( 'layout' ),
        subMode    = getProp( layout, ['subMode'] );

      // get query attribute
      var data = value;

      // check attr
      if ( attr == 'reader-barcode' ) {

        // update attr
        attr = 'animalno';
      }

      // check attribute for 'lfrfid'
      if ( attr == 'lfrfid' ) {

        // remove leading zeros
        value = trimStart( value, '0' );
      }

      // check reader mode
      if ( getProp(layout, 'locationOverview') ) {

        // update reader mode
        // readerMode = Const.MULTI_MODE;

        // get data
        data = data.indexOf('|') < 0 ? [] : data.split('|');
      }

      /* // labels
      var b0 = session.get( 'sp_lang', 'SP_IndexErrorMsg6') || Language.index.errorMsg6[this.lang];
      var b4 = session.get( 'sp_lang', 'SP_Toast11') || Language.toast['11'][this.lang];
      var t1 = session.get( 'sp_lang', 'SP_Toast17') || Language.toast['17'][this.lang];
      var t2 = session.get( 'sp_lang', 'SP_Toast18') || Language.toast['18'][this.lang]; */

      // check data
      if ( isArray(data) && data.length ) {

        // toast
        $.publish( 'toast', [0, 'to do: implement reading multiple animals!'] );

        // resume
        return;
      }

      // select focused element
      // var $focusedInputField = this.$('input[name="active-field"]');
      var $focusedInputField = table.$( 'input:focus' );

      // check if editableId element exists
      if ($focusedInputField.length) {

        // update input field and resume
        // this.$('input[name="active-field"]').val( value );
        $focusedInputField.val( value ).caret( value.length );

        // resume
        return;
      }

      // check popup state
      if ( this.popup ) {

        // get dialog
        dialog = this.getView( '.progeny-modal' );

        // validate dialog
        if ( !dialog ) {

          // log
          log( 'no dialog!' );

          // resume
          return;
        }

        // get form view
        formView = dialog.getView( '.body-component' );

        // validate form view
        if ( !formView ) return;

        // update dialog view form
        formView.updateField( value );

        // resume
        return;
      }

      // get row
      tRow = table.getRowsBy( attr, value, true );

      // validate marked row
      if ( !tRow ) {

        // toast
        $.publish( 'toast', [2, attr.toUpperCase() + ' = ' + value + ' not found!'] );

        // resume
        return;
      }

      // check if is already marked
      if ( tRow.mark() ) {

        // log
        log( 'row already marked! resume...' );

        // resume
        return;
      }

      // mark row
      tRow.mark( 1 );

      // check submode
      switch( subMode ) {

      // none
      case 0:

        // resume
        if( !table.updateRowBy( attr, value, tRow ) ) return;

        // save row into database store
        this
          .saveRow(tRow.toJSON())
          .then(function(){

            // render table
            table.render();
          })
          .catch(this.handleError.bind(this));
        break;

      // check
      case 1:

        // check if row already checked
        if ( tRow.check() ) {

          // log
          log( 'row already checked! resume...' );

          // resume
          return;
        }

        // get table row
        tRow = table.toggleCheckRowBy( attr, data, tRow );

        // check table row
        if ( !tRow ) {

          // check  type
          if ( typeof tRow !== 'undefined' ) {

            // toast and resume
            return $.publish( 'toast', [2, 'could not toggle row with attr = ' + attr + ', and value = ' + data] );
          }

          // resume
          return;
        }

        // save row into database store
        this
          .saveRow(tRow.toJSON())
          .then(function(){

            // render table
            table.render();

            // get counter view
            var counter = _self.getView( '.footer-left' );

            // check counter
            if ( counter && table ) {

              // update counter
              var hasCheckmark = _self.model.get( 'hasCheckmark' );

              // has checkmark
              if ( hasCheckmark ) {
                var _checkedRows  = table.getCheckedRows( true );
                var _selectedRows = table.getSelectedRows( true );

                // update counter view
                counter.update( 'selected', _checkedRows.length );
                counter.update( 'total', _selectedRows.length );
              }
            }
          })
          .catch(this.handleError.bind(this));
        break;

      // popup
      case 2:

        // get dialog
        dialog = table.popupRowBy( attr, value, tRow );

        // popup table row by attr and data
        if ( !dialog ) return;

        // try to refresh main component
        this
          .refreshTable(table)
          .then(function(){

            // get counter view
            var counter = _self.getView( '.footer-left' );

            // check counter
            if ( counter && table ) {

              // update counter
              var hasCheckmark = _self.model.get( 'hasCheckmark' );

              // has checkmark
              if ( hasCheckmark ) {
                var _checkedRows  = table.getCheckedRows( true );
                var _selectedRows = table.getSelectedRows( true );

                // update counter view
                counter.update( 'selected', _checkedRows.length );
                counter.update( 'total', _selectedRows.length );
              }
            }

            // listen for custom events
            dialog.on( 'visible', _self.togglePopup, _self );
            dialog.on('hidden', function(){

              // update popup state
              _self.togglePopup();

              // remove dialog from the top view
              _self.removeView( '.progeny-modal' );
            });

            // set dialog view
            _self.setView( '.progeny-modal', dialog );

            // render dialog
            dialog.render();
          });
        break;

      // check and popup
      case 3:

        // check if row already checked
        if ( tRow.check() ) {

          // log
          log( 'row already checked! resume...' );

          // decrement checked rows
          this.decrementSelected();

          // resume
          return;
        }

        // get table row
        tRow = table.toggleCheckRowBy( attr, data, tRow );

        // check table row
        if ( !tRow ) {

          // check  type
          if ( typeof tRow !== 'undefined' ) {

            // toast and resume
            return $.publish( 'toast', [2, 'could not toggle row with attr = ' + attr + ', and value = ' + data] );
          }

          // resume
          return;
        }

        // increment checked rows
        this.incrementSelected();

        // get dialog
        dialog = table.popupRowBy( attr, value, tRow );

        // validate dialog
        if ( !dialog ) return;

        // save row into database store
        this
          .saveRow(tRow.toJSON())
          .then(function(){

            // try to refresh main component
            return _self.refreshTable(table);
          })
          .then(function(){

            // get counter view
            var counter = _self.getView( '.footer-left' );

            // check counter
            if ( counter && table ) {

              // update counter
              var hasCheckmark = _self.model.get( 'hasCheckmark' );

              // has checkmark
              if ( hasCheckmark ) {
                var _checkedRows  = table.getCheckedRows( true );
                var _selectedRows = table.getSelectedRows( true );

                // update counter view
                counter.update( 'selected', _checkedRows.length );
                counter.update( 'total', _selectedRows.length );
              }
            }

            // listen for custom events
            dialog.on( 'visible', _self.togglePopup, _self );
            dialog.on('hidden', function(){

              // update popup state
              _self.togglePopup();

              // remove dialog from the top view
              _self.removeView( '.progeny-modal' );
            });

            // set dialog view
            _self.setView( '.progeny-modal', dialog );

            // render dialog view
            dialog.render();
          })
          .catch(this.handleError.bind(this));
        break;

      default:

        // toast and resume
        $.publish( 'toast', [2, 'submode not defined!'] );
        break;
      }
    }
  };
};
