'use strict';

// libs
import getProp from 'get-prop';

// lodash functions
import { isArray, capitalize, isPlainObject } from 'lodash';

// singleton vars
var log;

// progeny view
export default ($, debug, Backbone, Language, BaseView, utils, session ) => {

  // return progeny view
  return class P extends BaseView {

    constructor(o) {
      super(o);
    }

    // overwrite parent method
    initialize(opt) {

      // init logging
      log = debug( 'ProgenyView' );

      // call parent method
      BaseView.prototype.initialize.call( this, opt );

      // labels
      var u6 = session.get( 'sp_lang', 'SP_ButtonAddRow') || Language.button.addRow[this.lang];
      var t0 = session.get( 'sp_lang', 'SP_LabelsAction') || Language.labels.actions[this.lang];
      var t1 = session.get( 'sp_lang', 'SP_LabelsFilter') || Language.labels.filter[this.lang];

      // show add row
      var layout = this.model.get( 'layout' );

      // add row action
      var addRowAction = {
        icon: 'plus',
        title: u6,
        event: 'create'
      };

      // set specific props
      this.dropdown   = true;
      this.dropLabel  = t0;
      this.actionList = [{
        icon: 'filter',
        title: capitalize( t1 ),
        event: 'filter'
      }];

      // check layout
      if ( layout.showAddRow ) {

        // add add row action
        this.actionList.push( addRowAction );
      }

      // back label
      var backLabel = session.get( 'sp_lang', 'SP_Back') || Language.button.back[this.lang];

      this.divider    = true;
      this.separator  = {
        icon: 'arrow-left',
        title: backLabel,
        event: 'back'
      };
    }

    // update total number of visible rows
    updateTotalCounter( tableView ) {

      // check table view
      if ( !tableView ) return;

      // get counter view
      var counter = this.getView( '.footer-left' );

      // get visible rows
      var visibleRows = tableView.getVisibleRows();

      // check number of visible rows
      if ( isArray(visibleRows) ) {

        // update counter view
        counter.update( 'total', visibleRows.length );
      }
    }

    updateView( rows, layout ) {
      var _self = this;
      var tableView = this.getView( '.main-component' );

      // no new layout
      layout = layout ? layout : this.model.get( 'layout' );

      // log
      log( rows );
      log( layout );

      // update model
      tableView.model.set({ tRows: rows });

      // refresh table
      return this
        .refreshTable(tableView)
        .then(function(){

          // update number of visible rows
          _self.updateTotalCounter( tableView );

          // resolve
          return [ rows, layout, undefined ];
        });
    }

    // on create new row
    onCreate() {
      var table = this.getView( '.main-component' );

      // labels
      var t1 = session.get( 'sp_lang', 'SP_ButtonAddRow') || Language.button.addRow[this.lang];

      // get layout
      var layout = this.model.get( 'layout' );

      // check layout
      if ( !isPlainObject(layout) ) {

        // toast and resume
        return $.publish('toast', [2, 'Layout not found!']);
      }

      // get layout's requestKey (layout name)
      var lName = getProp( layout, ['requestKey'], '' );

      // check layout name
      if ( !lName ) {

        // toast and resume
        return $.publish('toast', [2, 'Layout name not found!']);
      }

      // open row dialog
      var dialogView = table.openRowDialog({
        title: t1,
        mode: 'create',
        rowId: 'a',
        setDate: true,
        lang: this.lang,
        filterRow: this.filterRow,
        lName: lName
      });

      // validate dialog view
      if ( dialogView ) {

        // listen for custom events
        dialogView.on('visible', this.togglePopup, this );
        dialogView.on('hidden', this.togglePopup, this );

        // set dialog view
        this.setView( '.progeny-modal', dialogView );

        // render dialog view
        dialogView.render();
      }
    }

    // should be implemented only in progeny views
    onUpdateValue( event, options ) {

      // stop event propagation
      event.stopPropagation();

      // save context refference
      var _ctx  = this;
      var table = this.getView( '.main-component' );
      var rowId = getProp( options, ['rowId'], -1 );
      var tRow  = table.getRowsBy( 'id', rowId, true );

      // validate table row
      // if ( !tRow || options.newValue == options.oldValue ) return false;
      if ( !tRow ) return false;

      // update value and update dirty
      tRow.setValue( options.cIndex, options.newValue, true );

      // offline mode
      if ( !this.isOnline() ) {

        // get layout and request key
        var layout     = this.model.get( 'layout' );
        var requestKey = layout.requestKey;

        // local update and resume
        return this.localUpdate( options, requestKey, tRow, true );
      }

      // show spinner
      $.publish( 'spinner', [true] );

      // sync row
      this
        .syncRow( tRow.serialize() )
        .then(function() {

          // hide spinner
          $.publish( 'spinner', [false] );

          // clear any previous errors
          _ctx.model.set( 'error', {visible: false, title: '', message: ''} );

          // clear dirty
          if ( !tRow.clearDirty() ) {

            // resume
            throw {
              type: 6,
              source: 'SmartPigs',
              message: 'could not clear dirty on row id ' + rowId + ' @ProgenyView->onUpdateValue!'
            };
          }

          // check update dirty
          if ( table.updateRowBy( 'id', rowId, tRow ) ) {

            // check iClick
            if ( options.iClick == 5 || options.iClick == 6 || options.iClick == 7 || options.iClick == 10 ) {
              return _ctx
                .refreshTable(table)
                .then(function(){

                  // resolve promise
                  return true;
                });
            }

            // return a promise
            return true;
          }

          // resolve
          return false;
        })
        .then(function(edit){

          // check edit
          if ( edit ) {

            // edit next cell
            table.editNextCell( options.rIndex + 1, options.cIndex );
          }

          // hide spinner
          $.publish( 'spinner', [false] );
        })
        .catch(function(err){

          // switch error code
          switch ( err.type ) {

          // no response
          case 0:
          case 2: // other errors
          case 6: // smartpigs errors

            // handle error
            _ctx.handleError( err );

            // if not table cell, trigger click
            if ( options.iClick !== 3 ) {

              // get current cell and trigger click
              table.getTableCell( options.rIndex + 1, options.cIndex ).trigger( 'click' );
            }
            break;

          // no user
          case 1:

            // session expired
            $.publish('session-expired', function() {

              // trigger update
              $.publish( 'update-view', [options] );
            });

            // hide spinner
            $.publish( 'spinner', [false] );
            break;

          // no connection
          case 4:

            // update connection
            _ctx.updateConnection( false );

            // enhance error
            err.message = err.connectionState == 2 ? 'Connection timeout!' : 'No conection!';

            // handle error
            _ctx.handleError( err );
            break;
          }
        });
    }

    // on back custom handler
    onBack() {

      // check if any modal dialog is active
      if ( this.popup ) {

        // get active modal
        var activeModal = this.getView( '.progeny-modal' );

        // check active modal
        if ( !activeModal ) return;

        // toggle active modal
        activeModal.toggle();

        // resume
        return;
      }

      // get previous route
      var previousRoute = this.model.get( 'previousRoute' ) || 'mainmenu';

      // navigate
      Backbone.history.navigate( previousRoute, { trigger: true } );
    }

    /**
     * should be overwritten by subviews
     * on positive dispatch handler
     * @param  {Layout} dialog - dialog view
     * @param  {object} options - contains original event informations
     * @param  {Backbone.Model} tRow - working row
     * @return {[type]}         [description]
     */
    onPositive( dialog, options, tRow ) {
      var _ctx = this,
        mode  = getProp( options, ['mode'] ),
        table = this.getView( '.main-component' );

      // validate
      if ( !dialog ) return;

      // get layout
      var layout = this.model.get( 'layout' );

      // define error handler
      var errHandler = function(err){

        // log
        console.log( err );

        // get local vars
        var errType   = getProp( err, ['type'], 6 );
        var errSource = getProp( err, ['name'], 'Database' );

        // check error type
        switch( errType ) {

        // no user
        case 1:

          // hide dialog and toggle login dialog
          dialog.hide(function(){

            // session expired
            $.publish( 'session-expired', function(){

              // trigger update
              $.publish( 'update-view', [options] );
            });
          });
          break;

        // other errors (smartpigs errors)
        default:

          // dialog trigger error
          dialog.model.set('error', {
            visible: true,
            title: errSource + ': ',
            message: err.message
          });

          // manually rerender
          dialog.updateError();
          break;
        }

        // hide spinner
        $.publish( 'spinner', [false] );
      };

      // check mode
      switch( mode ) {
      case 'create':

        // new row has been created (add layout name)
        tRow.set( 'layout', options.lName );

        // offline
        if ( !this.isOnline() ) {

          // or using promises
          return this
            .saveRow(tRow.toJSON())
            .then(function() {

              // check if store is not dirty
              if ( !session.get( 'dirty', layout.requestKey ) ) {

                // update dirty
                session.set( 'dirty', layout.requestKey, 1 ).persist();
              }

              // insert row
              if ( table.insertRow(tRow.toJSON()) ) {

                // refresh table
                return _ctx
                  .refreshTable(table)
                  .then(function(){

                    // update counter
                    _ctx.updateTotalCounter( table );

                    // hide dialog
                    dialog.toggle();
                  });
              }

              // reject promise
              throw {
                type: 6,
                source: 'SmartPigs',
                message: 'could not insert row into the table @ProgenyView:create->onPositive!'
              };
            })
            .catch(errHandler);
        }

        // sync row
        this
          .syncRow( tRow.serialize() )
          .then(function(result) {

            // check result
            if ( isNaN(result) ) {

              // return error
              throw {
                type: 2,
                name: 'ServerError',
                message: result.substring( 1, result.length )
              };
            }

            // clear dirty
            if ( !tRow.clearDirty() ) {

              // return error
              throw {
                type: 6,
                name: 'SmartPigsError',
                message: 'could not clear dirty on row id = ' + tRow.getId()
              };
            }

            // update id
            if ( !tRow.setId(utils.toNumber(result)) ) {

              // return error
              throw {
                type: 6,
                name: 'SmartPigsError',
                message: 'could not update row with id = ' + result
              };
            }

            // handle error
            if ( !table.insertRow(tRow.toJSON()) ) {

              // return error
              throw {
                type: 6,
                name: 'SmartPigsError',
                message: 'could not append row into the table view @newProgenyRow'
              };
            }

            // refresh table
            return _ctx.refreshTable(table);
          })
          .then(function(){

            // update counter
            _ctx.updateTotalCounter( table );

            // hide dialog
            dialog.toggle();

            // resume
            return true;
          })
          .catch(errHandler);
        break;
      case 'filter':

        // update filter row
        this.filterRow = tRow;

        // filter rows
        this
          .filterRows()
          .then(function(){

            // get hidden/filtered rows
            var hiddenRows = table.getSelectedRows( false );

            // get counter view
            var counter = _ctx.getView( '.footer-left' );

            // check counter view
            if ( counter ) {

              // update hidden rows
              counter.update( 'hidden', hiddenRows.length );
            }

            // hide dialog
            dialog.toggle();
          });
        break;
      default:
        break;
      }
    }

    /**
     * should be implemented in progeny view only
     * on remove row handler
     * @param  {object} options - remove options
     * @return {[type]}         [description]
     */
    onRemoveRow( options ) {
      var _self = this,
        rowId   = getProp( options, ['rowId'], -1 ),
        table   = this.getView( '.main-component' ),
        counter = this.getView( '.footer-left' ),
        tRow    = table.getRowsBy( 'id', rowId, true );

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

      // offline
      if ( !this.isOnline() ) {

        // delete while offline
        if ( rowId.toString().charAt(0) == 'a' ) {

          // get db connection
          return this
            .getConnection()
            .then(function(connection) {

              // use db connection to remove an item by id
              return connection.deleteRowBy( _self.tableName, {id: rowId} );
            })
            .then(function() {

              // delete row by id
              if ( !table.deleteRowBy('id', rowId) ){

                // reject promise
                throw {
                  type: 6,
                  name: 'SmartPigsError',
                  message: 'cannot remove row with id = ' + options.rowId + ' @onRemoveProgenyRow'
                };
              }

              // decrement counter
              counter.decr( 'total' );

              // rerender table view
              table.render();

              // log
              log( 'removed newly created row with id = ' + options.rowId + ' from the database as well as from data model'  );
            })
            .catch( this.handleError.bind(this) );
        }

        // update row and resume
        return this
          .saveRow(tRow.toJSON())
          .then(function() {

            // delete row by id
            if ( !table.deleteRowBy('id', options.rowId) ){

              // reject promise
              throw {
                type: 6,
                name: 'SmartPigsError',
                message: 'cannot remove row with id = ' + options.rowId + ' @onRemoveProgenyRow'
              };
            }

            // get layout and request key
            var layout     = _self.model.get( 'layout' );
            var requestKey = layout.requestKey;

            // check if store is not dirty
            if ( !session.get( 'dirty', requestKey ) ) {

              // update dirty
              session.set( 'dirty', requestKey, 1 ).persist();
            }

            // log
            log( 'row with id ' + options.rowId + ' was marked as deleted and saved into database' );

            // decrement counter
            counter.decr( 'total' );

            // rerender table view
            return table.render();
          })
          .catch( this.handleError.bind(this) );
      }

      // show spinner
      $.publish( 'spinner', [true] );

      // sync row
      this
        .syncRow( tRow.serialize() )
        .then(function() {

          // hide spinner
          $.publish( 'spinner', [false] );

          // clear any previous errors
          _self.model.set('error', {visible: false, title: '', message: '' });

          // remove row in the data model
          if ( !table.deleteRowBy('id', rowId) ) {

            // reject promise
            throw {
              type: 6,
              name: 'SmartPigsError',
              message: 'could not remove progeny row @onRemoveProgenyRow'
            };
          }

          // decrement counter
          counter.decr( 'total' );

          // rerender table view
          return table.render();
        })
        .catch(function(err){

          // hide spinner
          $.publish( 'spinner', [false] );

          // check error type
          switch ( err.type ) {

          // no user
          case 1:

            // session-expired
            $.publish( 'session-expired', function() {

              // attempt to delete row again
              _self.onRemoveRow( options );
            });
            break;

          // other errors
          default:

            // handle error
            _self.handleError( err );
            break;
          }
        });
    }

    // start listening for custom events
    startListening() {
      if ( this.listening ) return;

      // call parent method
      BaseView.prototype.startListening.call( this );

      // listen for 'update-view' event
      $.subscribe( 'update-view.progeny', this.onUpdateValue.bind(this) );
    }

    // stop listening for custom events
    stopListening() {
      if ( !this.listening ) return;

      // call parent method
      BaseView.prototype.stopListening.call( this );

      // unsubscribe custom listeners
      $.unsubscribe( 'update-view.progeny' );
    }

    // overwrite parent method
    cleanup(){

      // call parent method
      this.stopListening();
    }
  };
};
