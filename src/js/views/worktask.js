'use strict';

// libs
import getProp from 'get-prop';

// lodash functions
import { map, isArray, capitalize } from 'lodash';

// singleton vars
var log;

// create worktask view by extending base view
export default ($, debug, DateFormat, Backbone, isAndroid, Language, Const, BaseView, AlertModal, utils, session) => {

  // return worktask view
  return class V extends BaseView {

    constructor(o) {
      super(o);

      // default todo state
      this.todo = '';
    }

    // overwrite parent method
    initialize(opt) {

      // init log
      log = debug( 'WorkTask' );

      // call parent initialize
      BaseView.prototype.initialize.call( this, opt );

      // on update store (not done yet)
      this.on( 'update-store', this.onBack.bind(this) );

      // labels
      var b1 = session.get( 'sp_lang', 'SP_LabelsAction') || Language.labels.actions[this.lang];
      var b2 = session.get( 'sp_lang', 'SP_ButtonBatchRegistration') || Language.button.batchRegistration[this.lang];
      var b3 = session.get( 'sp_lang', 'SP_LabelsFilter') || Language.labels.filter[this.lang];
      var backLabel = session.get( 'sp_lang', 'SP_Back') || Language.button.back[this.lang];

      // set specific props
      this.dropdown   = true;
      this.dropLabel  = b1;
      this.actionList = [{
        icon: 'filter',
        title: capitalize( b3 ),
        event: 'filter'
      }, {
        icon: 'list-alt',
        title: capitalize( b2 ),
        event: 'batch-registration'
      }];
      this.divider    = true;
      this.separator  = {
        icon: 'arrow-left',
        title: backLabel,
        event: 'back'
      };
    }

    // overwrite parent method
    getData(obj) {
      var _self = this,

        // get a refference to the parent method
        _getData = BaseView.prototype.getData.call( this, obj );

      // endPoint
      var endPoint = getProp( obj, ['endPoint'] );

      // when done
      return _getData
        .then(function(arr){
          var rows    = arr[ 0 ];
          var layout  = arr[ 1 ];
          var animals = arr[ 2 ];

          // find mode
          if ( layout && layout.mainMode == 1 ) {

            // get table component
            var table = _self.getView( '.main-component' );

            // insert rows into main component model
            table.model.set( 'animals', animals );
          }

          // offline
          if ( !_self.isOnline() ) return arr;

          // save rows
          return _self
            .saveRows(rows)
            .then(function() {

              // update layout
              utils.updateLayoutBy( 'requestKey', endPoint, 'database', true );

              // log
              log( rows.length + ' items have been saved to ' + endPoint );

              // resolve promise
              return arr;
            });
        })
        .then(function(arr){

          // get views
          var counter = _self.getView( '.footer-left' );
          var tableView = _self.getView( '.main-component' );

          // check counter
          if ( counter && tableView ) {

            // update counter
            var hasCheckmark = _self.model.get( 'hasCheckmark' );

            // has checkmark
            if ( hasCheckmark ) {
              var _checkedRows  = tableView.getCheckedRows( true );
              var _selectedRows = tableView.getSelectedRows( true );

              // update counter view
              counter.update( 'selected', _checkedRows.length );
              counter.update( 'total', _selectedRows.length );
            }
          }

          // resume
          return arr;
        })
        .catch(function(err){

          // toast
          $.publish( 'toast', [3, 'Error: ' + err.message + ' @WorkTask->getData->' + endPoint] );

          // hide spinner
          $.publish( 'spinner', [false] );
        });
    }

    onBack() {

      // save context
      var _self = this;

      // check popup state
      if ( this.popup ) {

        // get current dialog
        var currentDialog = this.getView( '.progeny-modal' );

        // check current dialog
        if ( !currentDialog ) {

          // toast and resume
          return $.publish( 'toast', [2, 'popup active but no current dialog instance!'] );
        }

        // toggle current dialog
        currentDialog.toggle();

        // resume
        return;
      }

      // manually went offline
      if ( !this.isOnline() ) {

        // navigate
        Backbone.history.navigate( 'mainmenu', { trigger: true } );

        // resume
        return;
      }

      // init vars
      var layout = this.model.get( 'layout' );
      var requestKey = getProp( layout, ['requestKey'] );

      // hide spinner
      $.publish( 'spinner', [true] );

      // check environment
      var delay = Modernizr.smartpigs ? 100 : 1;

      // delay get dirty tasks
      setTimeout(function(){

        // get dirty tasks and attempt to sync them
        _self
          .getDirtyTasks( requestKey )
          .then(function(rows){

            // if no dirty rows
            if ( !rows.length ) {
              return _self
                .clearStore(requestKey)
                .then(function(){

                  // resolve promise
                  return true;
                });
            }

            // log
            log( 'object %O', rows );

            // check cookie value
            if( !_self.todo ) {

              // add another cookie
              _self.todo = 'test';
            }

            // sync row
            return _self
              .syncRow(rows)
              .then(function() {

                // clear dirty
                _self.model.set( 'dirty', false );

                // clear store
                return _self.clearStore(requestKey);
              })
              .then(function(){

                // return another promise
                return true;
              });
          })
          .then(function(bool){

            // remove cookie
            _self.todo = '';

            // check bool
            if ( bool ) {

              // force back
              _self.forceBack( requestKey );
            }
          })
          .catch(function(err){

            // hide spinner
            $.publish( 'spinner', [false] );

            // skip
            var skip = false;

            // generic modal
            var modal;

            // labels
            var b1 = session.get( 'sp_lang', 'SP_ModalsTitle5') || Language.modals.title5[_self.lang];
            var b2 = session.get( 'sp_lang', 'SP_ModalsTitle11') || Language.modals.title11[_self.lang];
            var b3 = session.get( 'sp_lang', 'SP_ButtonCancel') || Language.button.cancel[_self.lang];
            var b4 = session.get( 'sp_lang', 'SP_ButtonOk') || Language.button.ok[_self.lang];

            // switch error code
            switch ( err.type ) {

            // no user
            case 1:

              // update cookie
              _self.todo = 'test';

              // session expired
              $.publish('session-expired', function() {

                // attempt to go back again
                // _self.onBack( connectionStatus );
                _self.onBack();
              });

              // update skip flag
              skip = true;
              break;

            // no connection
            case 4:

              // show error dialog
              modal = AlertModal({
                title: b1,
                // message: err.message,
                message: err.message + ' ' + b2,
                cancel: b3,
                confirm: b4,
                confirmVisible: true,
                cancelVisible: true
              });

              // listen for confirm event
              modal.on( 'hidden', _self.togglePopup, _self );
              modal.on( 'visible', _self.togglePopup, _self );
              modal.on('confirm', function(){

                // update cookie
                _self.todo = 'save';

                // hide dialog
                this.hide(function(){

                  // clear dirty
                  _self.model.set( 'dirty', false );

                  // clear store
                  _self
                    .clearStore(requestKey)
                    .then(function(){

                      // go back ok, but save data this time
                      _self.onBack();
                    });
                });
              });
              break;

            default:

              // show error dialog
              modal = AlertModal({
                title: b1,
                // message: err.message,
                message: err.message + ' ' + b2,
                cancel: b3,
                confirm: b4,
                confirmVisible: true,
                cancelVisible: true
              });

              // listen for confirm event
              modal.on( 'hidden', _self.togglePopup, _self );
              modal.on( 'visible', _self.togglePopup, _self );
              modal.on('confirm', function(){

                // update cookie
                _self.todo = 'save';

                // hide dialog
                this.hide(function(){

                  // go back ok, but save data this time
                  // _self.onBack( connectionStatus );
                  _self.onBack();
                });
              });
              break;
            }

            // check skip
            if ( skip ) return;

            // set modal view
            _self.setView( '.progeny-modal', modal );

            // render alert modal
            modal.render();
          });
      }, delay);
    }

    forceBack(requestKey) {

      // update layout
      utils.updateLayoutBy( 'requestKey', requestKey, 'database', false );

      // navigate
      Backbone.history.navigate( 'mainmenu', { trigger: true } );
    }

    /**
     * on remove row handler
     * @param  {object} options - remove options
     * @return {[type]}         [description]
     */
    onRemoveRow(options) {
      var rowId    = getProp( options, ['rowId'], -1 ),
        table      = this.getView( '.main-component' ),
        tRow       = table.getRowsBy( 'id', rowId, true ),
        layout     = this.model.get( 'layout' ),
        offLineKey = layout.offLineKey;

      // validate table row
      if ( !tRow ) {

        // toast and resume
        return $.publish( 'toast', [2, 'SmartPigs Error: table row with id = ' + options.rowId + ', could not be found @onRemoveRow()!'] );
      }

      // update dirty row
      if ( !tRow.setDirty(-1) ) {

        // toast and resume
        return $.publish( 'toast', [2, 'SmartPigs Error: table row with id = ' + options.rowId + ', could not be set dirty @onRemoveRow()!'] );
      }

      // local update and resume
      this.localUpdate( options, offLineKey, tRow, true );
    }

    // update value
    onUpdateValue(event, options) {
      event.stopPropagation();

      var lastHeader,
        table      = this.getView( '.main-component' ),
        layout     = this.model.get( 'layout' ),
        offLineKey = layout.offLineKey;

      // update vars
      var group = getProp( options, ['iGroup'], -1 );
      var rowId = getProp( options, ['rowId'], -1 );
      var tRow  = table.getRowsBy( 'id', rowId, true );

      // check table row
      if ( !tRow ) return false;

      // get date format
      var dateFormat = session.get( 'settings', 'dateFormat' );

      // update value and update dirty
      tRow.setValue( options.cIndex, options.newValue, true );

      // get last header
      lastHeader = table.getLastHeader();

      // map through
      map(lastHeader, function(th, idx){

        // check table header
        if ( th.iGroup !== group ) return;

        // validate column type
        if ( th.iClick == 3 && !tRow.getValue(idx) ) {

          // create new date
          // var today = Moment().format( dateFormat ).toString();
          var today = DateFormat.asString( dateFormat, new Date() );

          // update value and update dirty
          tRow.setValue( idx, today, true );
        }
      });

      // local update and resume
      this.localUpdate( options, offLineKey, tRow, true );
    }

    /**
     * @param  {Layout} dialog - dialog view
     * @param  {object} options - contains original event informations
     * @param  {Backbone.Model} tRow - working row
     * @return {[type]}         [description]
     */
    onPositive(dialog, options, tRow) {
      var tRows, layout,
        _self = this,
        mode  = getProp( options, ['mode'] ),
        rowId = getProp( options, ['rowId'] ),
        table = this.getView( '.main-component' );

      // validate
      if ( !dialog ) {

        // hide spinner
        $.publish( 'spinner', [false] );

        // resume
        return;
      }

      // get layout
      layout = this.model.get( 'layout' );

      // labels
      var b1 = session.get( 'sp_lang', 'SP_IndexErrorMsg6') || Language.index.errorMsg6[_self.lang];

      // check mode
      switch( mode ) {
      case 'edit':

        // or using promises
        this
          .saveRow(tRow.toJSON())
          .then(function() {

            // could not update
            if ( !table.updateRowBy( 'id', rowId, tRow ) ) {

              // reject promise
              throw {
                type: 6,
                source: 'SmartPigsError',
                message: 'could not update row with id ' + rowId + ' @WorkTask->onPositive()'
              };
            }

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

            // toggle dialog
            dialog.toggle();
          })
          .catch(function(err){

            // update error and resume
            dialog.model.set('error', {
              visible: true,
              title: capitalize( b1 ) + ': ',
              message: err.message
            });

            // manually rerender
            dialog.updateError();
          });
        break;
      case 'batch':

        // check mode
        if ( mode == 'batch' ) {

          // update layout by row
          if ( !table.updateLayoutByRow( layout, tRow ) ) {

            // toast and resume
            return $.publish( 'toast', [2, 'SmartPigs Error: Could not update batch registration layout!'] );
          }
        }

        // get updated rows
        tRows = table.runBatch( tRow );

        // if batch operation succedeed
        if ( tRows.length ) {

          // save table in the database
          return this
            .saveTable(table, tRows)
            .then(function(){

              // check if store is not dirty
              if ( !session.get( 'dirty', layout.requestKey ) ) {

                // update dirty
                session.set( 'dirty', layout.requestKey, 1 ).persist();
              }

              // rerender view
              _self.model.set( 'dirty', true );

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

              // hide spinner
              $.publish( 'spinner', [false] );

              // toggle dialog
              dialog.toggle();
            })
            .catch(function(err){

              // hide spinner
              $.publish( 'spinner', [false] );

              // update error and resume
              dialog.model.set('error', {
                visible: true,
                title: 'SmartPigs ' + capitalize( b1 ) + ': ',
                message: err.message
              });

              // manually rerender
              dialog.updateError();
            });
        }

        // hide spinner
        $.publish( 'spinner', [false] );

        // toggle dialog
        dialog.toggle();
        break;
      case 'filter':

        // update filter row
        this.filterRow = tRow;

        // filter rows
        this
          .filterRows()
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

            // hide dialog
            dialog.toggle();
          });
        break;
      default:
        break;
      }
    }

    // on batch dialog
    onBatchDialog() {

      // labels
      var b1 = session.get( 'sp_lang', 'SP_ButtonBatchRegistration') || Language.button.batchRegistration[this.lang];
      var b2 = session.get( 'sp_lang', 'SP_ButtonOk') || Language.button.ok[this.lang];
      var b3 = session.get( 'sp_lang', 'SP_ButtonCancel') || Language.button.cancel[this.lang];

      var dialogView,
        table = this.getView( '.main-component' );

      // open row dialog
      // dialogView = table.openRowDialog({
      // dialogView = table.openNewBatchRegistrationDialog({
      dialogView = table.openBatchRegistrationDialog({
        mode: 'batch',
        icon: 'glyphicon-edit',
        title: b1,
        setDate: true,
        lang: this.lang,
        filterRow: this.filterRow,
        positiveTitle: capitalize( b2 ),
        negativeTitle: b3,
      });

      // validate dialog view
      if ( dialogView ) {

        // attach custom events
        dialogView.on( 'hidden', this.togglePopup, this );
        dialogView.on( 'visible', this.togglePopup, this );

        // set progeny modal
        this.setView( '.progeny-modal', dialogView );

        // render dialog view
        dialogView.render();
      }
    }

    /**
     * get dirty tasks
     * @return {promise|undefined} - return a promise or undefined if offline
     */
    getDirtyTasks(dbStore) {

      // save context
      var _ctx = this;

      // get db connection
      return this
        .getConnection()
        .then(function(connection) {

          // use db connection
          return connection.getRowsBy( _ctx.tableName, {layout: dbStore, isDirty: 1} );
        })
        .then(function(rows){

          // if no dirty rows
          if ( !isArray(rows) ) {

            // reject promise
            throw {
              type: 6,
              source: 'SmartPigsError',
              message: 'no dirty rows @WorkTask:getDirtyTasks()'
            };
          }

          // resolve promise
          return rows;
        });
    }

    /**
     * save all table rows into database store. should be moved out of table api
     * @param  {string}   dbStore - database store
     * @param  {function} cb - callback to execute if operation success
     * @return {promise} - async operation should return a promise
     */
    saveTable(tableView, tRows) {

      // get table component
      tableView = tableView || this.getView( '.main-component' );
      tRows = tRows || tableView.model.get( 'tRows' );

      // check if any dirty rows
      if ( !tRows.length ) {

        // reject promise
        return Promise.reject({
          type: 6,
          source: 'SmartPigsError',
          message: 'no rows in the table'
        });
      }

      // save rows into db
      return this
        // call parent method
        // BaseView.prototype.saveTable.call(this, tRows)
        .saveRows(tRows)
        .then(function(){

          // resolve promise
          return tRows.length;
        });
    }

    // start listening for custom events
    startListening() {

      // already listening
      if ( this.isListening() ) return;

      // call parent method
      BaseView.prototype.startListening.call( this );

      // listen for 'update-view' event
      $.subscribe( 'update-view.worktask', this.onUpdateValue.bind(this) );

      // listen for global event 'reader-result'
      $.subscribe( 'reader-result.worktask', this.onReaderResult.bind(this) );

      // check droid
      if ( isAndroid ) {

        // get layout
        var layout = this.model.get( 'layout' );

        // reader mode
        var readerMode = getProp( layout, ['locationOverview'] ) ? Const.MULTI_MODE : Const.SINGLE_MODE;

        // update reader mode
        this.updateMode( readerMode );
      }
    }

    // stop listening for custom events
    stopListening() {

      // already stoped listening
      if ( !this.listening ) return;

      // call parent method
      BaseView.prototype.stopListening.call( this );

      // unsubscribe custom listeners
      $.unsubscribe( 'update-view.worktask' );
      $.unsubscribe( 'reader-result.worktask' );
    }

    // overwrite parent method
    cleanup() {

      // cleanup
      BaseView.prototype.cleanup.call( this );
    }
  };
};
