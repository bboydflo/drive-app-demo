'use strict';

// libs
import getProp from 'get-prop';

// lodash functions
import { map, filter, concat, isArray, isObject, trimStart, capitalize } from 'lodash';

// singleton vars
var log;

// create worktask view by extending base view
export default ($, axios, debug, DateFormat, Base64, Backbone, isAndroid,
  Const, Language, Row, BaseView, AlertModal, LoginController, utils, session) => {

  // return location overview
  return class V extends BaseView {

    constructor(o) {
      super(o);
    }

    // overwrite parent method
    initialize(opt) {

      // init log
      log = debug( 'LocationOverview' );

      // call parent initialize
      BaseView.prototype.initialize.call( this, opt );

      // listen for 'find-animal' event
      this.on( 'find-animal', this.onFindAnimal.bind(this) );

      // labels
      var t0 = session.get( 'sp_lang', 'SP_LabelsAction') || Language.labels.actions[this.lang];
      var u0 = session.get( 'sp_lang', 'SP_ButtonBatchRegistration') || Language.button.batchRegistration[this.lang];

      // back label
      var backLabel = session.get( 'sp_lang', 'SP_Back') || Language.button.back[this.lang];

      // set specific props
      this.dropdown   = true;
      this.dropLabel  = t0;
      this.actionList = [{
        icon: 'list-alt',
        title: capitalize( u0 ),
        event: 'batch-registration'
      }];
      this.divider    = true;
      this.separator  = {
        icon: 'arrow-left',
        title: backLabel,
        event: 'back'
      };
    }

    // get data
    getData(obj) {

      // save context
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

          // if data is received from the database -> resume
          if ( layout.database ) return;

          // create a new array of rows and animals
          var newArr = concat( rows, animals );

          // update rows and animals layout name
          // before saving into the database
          map( newArr, function(row){

            // add layout key
            row.layout = endPoint;
          });

          // save data into database
          return _self
            .saveRows(newArr)
            .then(function(){

              // get all the layouts
              var layouts = session.get( 'layouts' );

              // update layout
              layout.database = true;

              // update requestKey with value
              layout.requestKey = endPoint;

              // if nested layout does not exist
              if ( !utils.getNestedLayout(layouts, 'requestKey', endPoint) ) {

                // save it in the nested layouts object
                // update nested layouts
                layouts.nested.items.push( layout );
              }

              // update layouts
              session.set( 'layouts', layouts ).persist();

              // resolve promise
              return newArr.length;
            });
        })
        .catch( this.fetchFailed.bind(this) );
    }

    /**
     * on find animal callback triggered by 'find-animal' event
     * @param  {[type]} attr  [description]
     * @param  {[type]} value [description]
     * @return {[type]}       [description]
     */
    onFindAnimal(attr, value) {
      var dialog, fAnimal,
        _self   = this,
        table   = this.getView( '.main-component' ),
        counter = this.getView( '.footer-left' ),
        layout  = this.model.get( 'layout' ),
        subMode = layout.subMode;

      // get current rows
      var tRows = table.model.get( 'tRows' );

      // labels
      var u1 = capitalize( session.get( 'sp_lang', 'SP_IndexErrorMsg6') || Language.index.errorMsg6[this.lang] );
      var u2 = session.get( 'sp_lang', 'SP_Toast11') || Language.toast['11'][this.lang];
      var t1 = session.get( 'sp_lang', 'SP_Toast17') || Language.toast['17'][this.lang];
      var t2 = session.get( 'sp_lang', 'SP_Toast18') || Language.toast['18'][this.lang];

      // check if row already found in the collection
      if ( table.foundInColection(tRows, attr, value) ) {

        // define error message
        var errMessage = 'SmartPigs ' + u1 + ': ' + t1 + ' ' +  attr + ' = ' + value + ' ' + t2;

        // toast and resume
        return $.publish( 'toast', [2, errMessage] );
      }

      // get location overview flag
      var locationOverview = getProp( layout, ['locationOverview'], false );

      // get current animals
      var animals = table.model.get( 'animals' );

      // get animals
      var foundAnimals = table.foundInColection( animals, attr, value );

      // check found animals
      if ( !isArray(foundAnimals) ) {

        // check location overview
        if ( locationOverview ) {

          // toast and resume
          return $.publish( 'toast', [2, 'SmartPigs ' + u1 + ': ' + u2] );
        }

        // send request to pigvision
        return this
          .checkAnimalOnServer( attr, value, layout, false )
          .then(function(response) {

            // check response
            if ( !response ) return;

            // log
            console.log( response );

            // create a new row
            var tRow = new Row( response );

            // insert animal in the table
            // switch row from animals list to rows list
            tRow.set({ animal: 0, isDirty: 1, marked: 1 });

            // check if table has checkmark column
            if( table.getColumnProperty( 0, 'iClick' ) < 0 ) {

              // check animal
              tRow.check( 1 );
            }

            // insert animal
            if ( !table.insertRow(tRow.toJSON()) ) {

              // toast and resume
              return $.publish( 'toast', [2, 'SmartPigs Error: could not append row with ' + attr + ' : ' + value] );
            }

            // save it into the database as well
            _self
              .saveRow(tRow.toJSON())
              .then(function(){

                // refresh table
                return _self.refreshTable(table);
              })
              .then(function(){

                // get counter view
                var counter = _self.getView( '.footer-left' );

                // check counter
                if ( counter ) {

                  // folgeseddel
                  var _checkedRows = table.getRowsBy( 'marked', 1 );
                  var _selectedRows = table.getSelectedRows( true );

                  // update counter view
                  counter.update( 'selected', _checkedRows.length );
                  counter.update( 'total', _selectedRows.length );
                }
              });
          })
          // handle network errors or other error types
          .catch(function(err) {

            // check error type
            var errorType = err.type || false;

            // check if network error
            if ( errorType !== 5 ) {

              // handle other error types
              $.publish('toast', [ 2, 'Unhandled error: ' + (err.message || err.toString()) ]);
            }
          });
      }

      // get row
      fAnimal = new Row( foundAnimals[0] );

      // switch row from animals list to rows list
      fAnimal.set({ animal: 0, isDirty: 1, marked: 1 });

      // mode = mark | markandpopup
      if ( subMode == 1 || subMode == 3 ) {

        // check if row is already checked
        if ( fAnimal.check() ) return;

        // toggle check animal
        fAnimal.toggleCheck();
      }

      // insert animal
      if ( !table.insertRow(fAnimal.toJSON()) ) {

        // toast and resume
        return $.publish( 'toast', [2, 'SmartPigs Error: could not append row with ' + attr + ' : ' + value] );
      }

      // mode = popup | markandpopup
      if ( subMode == 2 || subMode == 3 ) {

        // get dialog view
        dialog = table.popupRowBy( attr, value, fAnimal );

        // popup table row by attr and data
        if ( !dialog ) {

          // toast and resume
          return $.publish( 'toast', [2, 'could not find row with attr = ' + attr + ', and value = ' + value] );
        }

        // attach custom events
        dialog.on( 'visible', this.togglePopup, this );
        dialog.on( 'hidden', this.togglePopup, this );
      }

      // save it into the database as well
      this
        .saveRow(fAnimal.toJSON())
        .then(function(){

          // refresh table
          return _self.refreshTable(table);
        })
        .then(function(){

          // update counter
          var hasCheckmark = _self.model.get( 'hasCheckmark' );

          // define vars
          var _checkedRows, _selectedRows, _visibleRows;

          // check counter
          if ( counter ) {

            // location overview
            if ( locationOverview ) {

              // check if has checkmark
              if ( hasCheckmark ) {
                _checkedRows  = table.getCheckedRows( true );
                _selectedRows = table.getSelectedRows( true );

                // update counter view
                counter.update( 'selected', _checkedRows.length );
                counter.update( 'total', _selectedRows.length );
              } else {

                // get visible rows
                _visibleRows = table.getVisibleRows();

                // check number of visible rows
                if ( isArray(_visibleRows) ) {

                  // update counter view
                  counter.update( 'total', _visibleRows.length );
                }
              }
            } else {
              // følgeseddel
              // count marked rows and total
              _checkedRows = table.getRowsBy( 'marked', 1 );
              _selectedRows = table.getSelectedRows( true );

              // update counter view
              counter.update( 'selected', _checkedRows.length );
              counter.update( 'total', _selectedRows.length );
            }
          }

          // check sub mode again
          if ( subMode == 2 || subMode == 3 ) {

            // set dialog view
            _self.setView( '.progeny-modal', dialog );

            // render dialog view
            dialog.render();
          }

          // log
          log( 'animal with attr = ' + attr + ' and value = ' + value + ' has been found and inserted into the tabel' );
        })
        .catch(this.handleError.bind(this));
    }

    /**
     * update view
     * @param  {string|array} result - request reponse
     * @return {[type]}        [description]
     */
    updateView(rows, layout, animals) {
      var mode = Const.SINGLE_MODE,
        _self = this;

      // log
      log( rows );
      log( layout );

      // get views
      var tableView = this.getView( '.main-component' );

      // validate views
      if ( !tableView ) {

        // resume
        return Promise.reject({
          type: 6,
          source: 'SmartPigsError',
          message: 'missing view @LocationOverview->updateView()'
        });
      }

      // filter through table rows to get the correct number of visible rows
      var visibleRows = filter(rows, function( tRow ){ return !tRow.hidden; });

      // get reader mode
      var reader           = getProp( layout, ['reader'] );
      var locationOverview = getProp( layout, ['locationOverview'] );

      // check if has checkmark
      if ( layout.thead[layout.thead.length-1].th[0].iClick < 0 ) {

        // update model
        this.model.set( 'hasCheckmark', true );
      }

      // define common update object
      var updateObject = {
        tCheck: locationOverview,
        tHead: layout.thead,
        tRows: rows,
        animals: animals
      };

      // add reader support
      // afprøvning and følgeseddel have set attributes [reader=true, locationOverview=false]
      // locationOverview has set attributes [reader=true, locationOverview=true]
      if ( reader && locationOverview ) {

        // update reader mode
        mode = Const.MULTI_MODE;

        // update table model
        updateObject.toggleAll = !tableView.model.get( 'toggleAll' );

        // mark visible rows
        map(visibleRows, function( tRow ){

          // check row
          tRow.data[0] = 1;
        });
      }

      // update reader mode (if possible)
      this.updateMode( mode );

      // update model
      tableView.model.set( updateObject );

      // full layout model update
      var fullModel = {
        layout: layout,
        findAnimal: false
      };

      // find mode
      if ( getProp(layout, ['mainMode']) == 1 ) {

        // update full model
        fullModel.findAnimal = true;
      }

      // update model
      this.model.set( fullModel );

      // return promise
      return new Promise(function(resolve){

        // rerender completely and resume
        _self
          .render()
          .promise()
          .done(function(){

            // get counter view
            var counter = _self.getView( '.footer-left' );

            // update counter
            var hasCheckmark = _self.model.get( 'hasCheckmark' );

            // define vars
            var _checkedRows, _selectedRows, _visibleRows;

            // check counter
            if ( counter ) {

              // location overview
              if ( locationOverview ) {

                // check if has checkmark
                if ( hasCheckmark ) {
                  _checkedRows  = tableView.getCheckedRows( true );
                  _selectedRows = tableView.getSelectedRows( true );

                  // update counter view
                  counter.update( 'selected', _checkedRows.length );
                  counter.update( 'total', _selectedRows.length );
                } else {

                  // get visible rows
                  _visibleRows = tableView.getVisibleRows();

                  // check number of visible rows
                  if ( isArray(_visibleRows) ) {

                    // update counter view
                    counter.update( 'total', _visibleRows.length );
                  }
                }
              } else {
                // folgeseddel
                _checkedRows = tableView.getRowsBy( 'marked', 1 );
                _selectedRows = tableView.getSelectedRows( true );

                // update counter view
                counter.update( 'selected', _checkedRows.length );
                counter.update( 'total', _selectedRows.length );
              }
            }

            // resolve promise
            resolve([ rows, layout, animals ]);
          });
      });
    }

    // on batch dialog
    onBatchDialog() {
      var table = this.getView( '.main-component' );

      // labels
      var b1 = session.get( 'sp_lang', 'SP_ButtonCancel') || Language.button.cancel[this.lang];
      var b2 = session.get( 'sp_lang', 'SP_ButtonOk') || Language.button.ok[this.lang];
      var u0 = session.get( 'sp_lang', 'SP_ButtonBatchRegistration') || Language.button.batchRegistration[this.lang];

      // open row dialog
      // var dialogView = table.openRowDialog({
      var dialogView = table.openBatchRegistrationDialog({
        lang: this.lang,
        mode: 'batch',
        icon: 'glyphicon-edit',
        title: u0,
        setDate: true,
        positiveTitle: capitalize(b2),
        negativeTitle: b1
      });

      // validate dialog view
      if ( dialogView) {

        // attach custom events
        dialogView.on( 'hidden', this.togglePopup, this );
        dialogView.on( 'visible', this.togglePopup, this );

        // set progeny modal
        this.setView( '.progeny-modal', dialogView );

        // render dialog view
        dialogView.render();
      }
    }

    // on back handler
    onBack() {
      var details, previousRoute;

      // save context
      var _self = this;

      // check if any modal dialog is active
      if ( this.popup ) {

        // get activ modal
        var activeModal = this.getView( '.progeny-modal' );

        // check active modal
        if ( !activeModal ) return;

        // toggle active modal
        activeModal.toggle();

        // resume
        return;
      }

      // get current fragment
      var fragment = Backbone.history.fragment;

      // check fragment
      if ( fragment.indexOf('n/') < 0 ) {

        // toast
        $.publish( 'toast', [2, 'SmartPigs navigation error!'] );

        // navigate
        Backbone.history.navigate( 'mainmenu', { trigger: true } );

        // resume
        return;
      }

      try {

        // get fragment
        fragment = JSON.parse( Base64.decode(fragment.split('n/')[1]) );
      } catch(e) {

        // toast
        $.publish( 'toast', [2, 'SmartPigs navigation error! (Error: ' + e.message + ')'] );

        // navigate
        Backbone.history.navigate( 'mainmenu', { trigger: true } );

        // resume
        return;
      }

      // simple fragment validation
      if ( !isArray(fragment) || !fragment.length ) {

        // toast
        $.publish( 'toast', [2, 'SmartPigs navigation fragment error!'] );

        // navigate
        Backbone.history.navigate( 'mainmenu', { trigger: true } );

        // resume
        return;
      }

      // remove current route
      details = fragment.pop();

      // log
      // console.log( details );

      // get layouts
      var layouts = session.get( 'layouts' );

      // build endpoint
      var endPoint = details.requestKey + '/' + details.rowId + '/' + details.cIndex;

      // get layout
      // var layout = utils.getNestedLayout( layouts, 'requestKey', endPoint );

      // log
      // console.log( layout );

      // validate details
      if ( !details || !isObject(details) ) {

        // toast
        $.publish( 'toast', [2, 'SmartPigs navigation route error!'] );

        // navigate
        Backbone.history.navigate( 'mainmenu', { trigger: true } );

        // resume
        return;
      }

      // check fragment length
      if ( fragment.length === 0 ) {

        // get previous route
        previousRoute = 'p/' +details.requestKey;
      } else {

        // get previous route
        previousRoute = 'n/' + Base64.encode( JSON.stringify(fragment) );
      }

      // get login api
      var loginApi = LoginController( session );

      // check connection status
      loginApi
        .checkStatus( session )
        .then(function(){

          // init vars
          var layout = _self.model.get( 'layout' ),
            requestKey = getProp( layout, ['requestKey'] );

          // launch spinner
          $.publish( 'spinner', [true] );

          // get rows
          return _self.getDirtyRows( requestKey );
        })
        .then(function(rows) {

          // no dirty rows
          if ( !rows.length ) return;

          // sync rows
          return _self.syncRow(rows);
        })
        .then(function(){

          // get db connection
          return _self
            .clearStore(endPoint)
            .then(function(){

              // store cleared
              // console.log( 'store ' + endPoint + ' cleared' );

              // resume success
              return true;
            });
        })
        .then(function(success) {

          // check success
          if ( success ) {

            // clear dirty
            _self.model.set( 'dirty', false );

            // remove nested layout
            utils.removeNestedLayout( layouts, 'requestKey', endPoint );

            // navigate
            Backbone.history.navigate( previousRoute, { trigger: true } );
          }
        })
        .catch(function(err){

          // modal view
          var modal;

          // skip flag
          var skip = false;

          // hide spinner
          $.publish( 'spinner', [false] );

          // labels
          var u3 = session.get( 'sp_lang', 'SP_ModalsTitle5') || Language.modals.title5[_self.lang];
          var u4 = session.get( 'sp_lang', 'SP_ButtonCancel') || Language.button.cancel[_self.lang];
          var u5 = session.get( 'sp_lang', 'SP_ButtonOk') || Language.button.ok[_self.lang];

          // switch error code
          switch ( err.type ) {

          // no user
          case 1:

            // session expired
            $.publish('session-expired', function() {

              // attempt to go back again
              _self.onBack();
            });

            // update skip flag
            skip = true;
            break;

          // no connection
          case 4:

            // show error dialog
            modal = AlertModal({
              title: u3,
              message: err.message + Language.modals.title15[_self.lang],
              cancel: u4,
              confirm: u5,
              confirmVisible: false,
              cancelVisible: true
            });
            break;

          default:

            // show error dialog
            modal = AlertModal({
              title: u3,
              message: err.message,
              cancel: u4,
              confirm: u5,
              confirmVisible: true,
              cancelVisible: false
            });
            break;
          }

          // check skip flag
          if ( skip ) return;

          // listen for custom events
          modal.on( 'hidden', _self.togglePopup, _self );
          modal.on( 'visible', _self.togglePopup, _self );
          modal.on('confirm', function(){

            // clear dirty
            _self.model.set( 'dirty', false );

            // hide dialog
            this.hide(function(){

              // get db connection
              _self
                .clearStore(endPoint)
                .then(function(){

                  // remove nested layout
                  utils.removeNestedLayout( layouts, 'requestKey', endPoint );

                  // navigate
                  Backbone.history.navigate( previousRoute, { trigger: true } );
                });
            });
          });

          // set modal view
          _self.setView( '.progeny-modal', modal );

          // render alert modal
          modal.render();
        });
    }

    getDirtyRows(){
      var table = this.getView( '.main-component' ),
        rows = table ? table.model.get( 'tRows' ) : [];

      // filter rows and remove deleted or unmarked rows
      return filter(rows, function(tRow){

        // filter criteria
        return tRow.isDirty;
      });
    }

    /**
     * on remove row handler
     * @param  {object} options - remove options
     * @return {[type]}         [description]
     */
    onRemoveRow(options) {
      var _self = this;
      var rowId = getProp( options, ['rowId'], -1 );
      var table = this.getView( '.main-component' );
      var tRow  = table.getRowsBy( 'id', rowId, true );

      // validate table row
      if ( !tRow || !table ) {

        // toast and resume
        return $.publish( 'toast', [2, 'SmartPigs Error: table row with id = ' + options.rowId + ', could not be set dirty @LocationOverview->onRemoveRow()!'] );
      }

      // if row is marked
      if ( tRow.isMarked() ) {

        // move it back to animals list
        tRow.set({ animal: 1, marked: 0, selected: 0 });

        // clear dirty
        tRow.clearDirty();

        // remove row from the table (delete row by Id)
        table.deleteRowId( rowId );
      } else  {

        // like before
        // update dirty row
        if ( !tRow.setDirty(-1) ) {

          // toast and resume
          return $.publish( 'toast', [2, 'SmartPigs Error: table row with id = ' + options.rowId + ', could not be set dirty @onRemoveRow()!'] );
        }

        // check update dirty
        if ( !table.updateRowBy('id', rowId, tRow) ) {

          // toast and resume
          return $.publish( 'toast', [2, 'SmartPigs Error: table row with id = ' + options.rowId + ', could not be updated @onRemoveRow()!'] );
        }
      }

      var layout = this.model.get( 'layout' );
      var locationOverview = getProp( layout, ['locationOverview'] );

      // save it into the database as well
      this
        .saveRow(tRow.toJSON())
        .then(function(){

          // refresh table
          return _self.refreshTable(table);
        })
        .then(function(){

          // get counter view
          var counter = _self.getView( '.footer-left' );

          // update counter
          var hasCheckmark = _self.model.get( 'hasCheckmark' );

          // define vars
          var _checkedRows, _selectedRows, _visibleRows;

          // check counter
          if ( counter ) {

            // location overview
            if ( locationOverview ) {

              // check if has checkmark
              if ( hasCheckmark ) {
                _checkedRows  = table.getCheckedRows( true );
                _selectedRows = table.getSelectedRows( true );

                // double check checked rows
                if ( isArray(_checkedRows) ) {

                  // update counter view
                  counter.update( 'selected', _checkedRows.length );
                } else {
                  counter.update( 'selected', 0 );
                }

                // double check checked rows
                if ( isArray(_selectedRows) ) {

                  // update counter view
                  counter.update( 'total', _selectedRows.length );
                } else {
                  counter.update( 'total', 0 );
                }
              } else {

                // get visible rows
                _visibleRows = table.getVisibleRows();

                // check number of visible rows
                if ( isArray(_visibleRows) ) {

                  // update counter view
                  counter.update( 'total', _visibleRows.length );
                } else {

                  // update counter view
                  counter.update( 'total', 0 );
                }
              }
            } else {
              // folgeseddel
              _checkedRows = table.getRowsBy( 'marked', 1 );
              _selectedRows = table.getSelectedRows( true );

              // double check checked rows
              if ( isArray(_checkedRows) ) {

                // update counter view
                counter.update( 'selected', _checkedRows.length );
              } else {
                counter.update( 'selected', 0 );
              }

              // double check checked rows
              if ( isArray(_selectedRows) ) {

                // update counter view
                counter.update( 'total', _selectedRows.length );
              } else {
                counter.update( 'total', 0 );
              }
            }
          }
        });
    }

    onUpdateValue(event, options) {
      event.stopPropagation();

      // var _self = this;
      var rowId = getProp( options, ['rowId'], -1 ),
        table = this.getView( '.main-component' ),
        tRow = table.getRowsBy( 'id', rowId, true );

      // simple row validation
      if ( !tRow ) return false;

      // get other details
      var group = getProp( options, ['iGroup'], -1 ),
        lastHeader = table.getLastHeader();

      // update value and dirty
      tRow.setValue( options.cIndex, options.newValue, true );

      // get date format
      var dateFormat = session.get( 'settings', 'dateFormat' );

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
      this.localUpdate( options, options.tableId, tRow, true );
    }

    /**
     * on reader result
     * @param  {[type]} event   [description]
     * @param  {[type]} options [description]
     * @return {[type]}         [description]
     */
    onReaderResult(ev, attr, value, full) {
      var data, tRow, dialog, formView, errMessage, fAnimals,
        _self = this,
        table = this.getView( '.main-component' ),
        layout = this.model.get( 'layout' );

      // check full
      full = full || false;

      // get locationOverview flag
      var isLocationOverview = getProp( layout, 'locationOverview' );

      // get query attribute
      data = value;

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

      // check popup state
      if ( this.popup ) {

        // get dialog
        dialog = this.getView( '.progeny-modal' );

        // validate dialog
        if ( !dialog ) return;

        // get form view
        formView = dialog.getView( '.body-component' );

        // validate form view
        if ( !formView ) return;

        // update dialog view form
        formView.updateField( value );

        // resume
        return;
      }

      // labels
      var u1 = capitalize( session.get( 'sp_lang', 'SP_IndexErrorMsg6') || Language.index.errorMsg6[this.lang] );
      var u2 = session.get( 'sp_lang', 'SP_Toast11') || Language.toast['11'][this.lang];
      var t1 = session.get( 'sp_lang', 'SP_Toast17') || Language.toast['17'][this.lang];
      var t2 = session.get( 'sp_lang', 'SP_Toast18') || Language.toast['18'][this.lang];

      // new labels
      var t3 = Language.toast['22'][this.lang];
      var t4 = Language.toast['23'][this.lang];
      var t5 = Language.toast['24'][this.lang];

      // get current rows and animals
      var tRows = table.model.get( 'tRows' );
      var animals = table.model.get( 'animals' );

      // check reader mode
      if ( isLocationOverview ) {

        // get data
        data = data.indexOf('|') < 0 ? [] : data.split('|');
      }

      // read multiple rfid's at once
      if ( isArray(data) && data.length ) {

        // add reader support
        if ( getProp(layout, ['reader']) ) {

          // filter already found animals
          var animalsToSearch = filter(data, function(val) {

            // filter condition
            return !table.foundInColection( tRows, attr, val );
          });

          // check animals to search
          if ( !animalsToSearch.length ) {

            // log
            console.log('all animals already found!');

            // toast and resume
            // return $.publish( 'toast', [2, 'all animals are already found!'] );
            return;
          }

          // define list of found animals
          var aList = [];

          // map through animals to search
          map(animalsToSearch, function(aVal) {

            // get animals
            var foundAnimals = table.foundInColection( animals, attr, aVal );

            // check found animals
            if ( !isArray(foundAnimals) ) {

              // isLocationOverview
              if ( isLocationOverview ) return;

              // toast and resume
              return $.publish( 'toast', [2, 'SmartPigs ' + u1 + ': ' + u2] );
            }

            // get row
            var fAnimal = new Row( foundAnimals[0] );

            // switch row from animals list to rows list
            fAnimal.set({ animal: 0, isDirty: 1, marked: 1 });

            // check if table has checkmark column
            if( table.getColumnProperty( 0, 'iClick' ) < 0 ) {

              // check animal
              fAnimal.check( 1 );
            }

            // insert animal
            if ( table.insertRow(fAnimal.toJSON()) ) {

              // update list of found animals
              aList.push( fAnimal );
            }
          });

          // check aList
          if ( !aList.length ) {

            // compare animalsToSearch length with data.length
            if ( animalsToSearch.length < data.length ) {

              // toast and resume
              return $.publish( 'toast', [2, (data.length - animalsToSearch.length) + t3 + animalsToSearch.length + t4 + '.'] );
            }

            // toast and resume
            return $.publish( 'toast', [2, capitalize(t5) + '.'] );
          }

          // save animals into db
          this
            .saveRows(aList)
            .then(function(){

              // refresh table
              return _self.refreshTable(table);
            })
            .then(function(){

              // get counter view
              var counter = _self.getView( '.footer-left' );

              // check counter
              if ( counter ) {

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
            });
        }

        // resume
        return;
      } else {

        /**
         * single uhfrfid
         * check reader support
         */
        if ( getProp(layout, ['reader']) ) {

          // check if row already found in the table
          if ( table.foundInColection(tRows, attr, value) ) {

            // define error message
            errMessage = 'SmartPigs ' + u1 + ': ' + t1 + ' ' +  attr + ' = ' + value + ' ' + t2;

            // toast and resume
            return $.publish( 'toast', [2, errMessage] );
          }

          // get animals
          fAnimals = table.foundInColection( animals, attr, value );

          // check found animals
          if ( !isArray(fAnimals) ) {

            // isLocationOverview
            if ( isLocationOverview ) return;

            // send request to pigvision
            return this
              .checkAnimalOnServer( attr, value, layout, full )
              .then(function(response) {

                // check response
                if ( !response ) return;

                // log
                console.log( response );

                // create a new row
                tRow = new Row( response );

                // insert animal in the table
                // switch row from animals list to rows list
                tRow.set({ animal: 0, isDirty: 1, marked: 1 });

                // check if table has checkmark column
                if( table.getColumnProperty( 0, 'iClick' ) < 0 ) {

                  // check animal
                  tRow.check( 1 );
                }

                // insert animal
                if ( !table.insertRow(tRow.toJSON()) ) {

                  // toast and resume
                  return $.publish( 'toast', [2, 'SmartPigs Error: could not append row with ' + attr + ' : ' + value] );
                }

                // save it into the database as well
                _self
                  .saveRow(tRow.toJSON())
                  .then(function(){

                    // refresh table
                    return _self.refreshTable(table);
                  })
                  .then(function(){

                    // get counter view
                    var counter = _self.getView( '.footer-left' );

                    // update counter
                    var hasCheckmark = _self.model.get( 'hasCheckmark' );

                    // define vars
                    var _checkedRows, _selectedRows, _visibleRows;

                    // check counter
                    if ( counter ) {

                      // location overview
                      if ( isLocationOverview ) {

                        // check if has checkmark
                        if ( hasCheckmark ) {
                          _checkedRows  = table.getCheckedRows( true );
                          _selectedRows = table.getSelectedRows( true );

                          // update counter view
                          counter.update( 'selected', _checkedRows.length );
                          counter.update( 'total', _selectedRows.length );
                        } else {

                          // get visible rows
                          _visibleRows = table.getVisibleRows();

                          // check number of visible rows
                          if ( isArray(_visibleRows) ) {

                            // update counter view
                            counter.update( 'total', _visibleRows.length );
                          }
                        }
                      } else {
                        // folgeseddel
                        _checkedRows = table.getRowsBy( 'marked', 1 );
                        _selectedRows = table.getSelectedRows( true );

                        // update counter view
                        counter.update( 'selected', _checkedRows.length );
                        counter.update( 'total', _selectedRows.length );
                      }
                    }
                  });

                // toast
                // $.publish('toast', [0, 'animal received']);
              })
              // handle network errors or other error types
              .catch(function(err) {

                // check error type
                var errorType = err.type || false;

                // check if network error
                if ( errorType !== 5 ) {

                  // handle other error types
                  $.publish('toast', [ 2, 'Unhandled error: ' + (err.message || err.toString()) ]);
                }
              });

            // toast and resume
            // return $.publish( 'toast', [2, 'SmartPigs ' + u1 + ': ' + u2] );
          }

          // get row
          tRow = new Row( fAnimals[0] );

          // switch row from animals list to rows list
          tRow.set({ animal: 0, isDirty: 1, marked: 1 });

          // check if table has checkmark column
          if( table.getColumnProperty( 0, 'iClick' ) < 0 ) {

            // check animal
            tRow.check( 1 );
          }

          // insert animal
          if ( !table.insertRow(tRow.toJSON()) ) {

            // toast and resume
            return $.publish( 'toast', [2, 'SmartPigs Error: could not append row with ' + attr + ' : ' + value] );
          }
        } else {

          // get rows
          fAnimals = table.foundInColection( tRows, attr, value );

          // check found animals
          if ( !isArray(fAnimals) ) return;

          // get row
          tRow = new Row( fAnimals[0] );

          // check if table has checkmark column
          if( table.getColumnProperty( 0, 'iClick' ) < 0 ) {

            // check animal
            tRow.check( 1 );
          }

          // mark row
          tRow.mark( 1 );

          // update row
          if( !table.updateRowBy( attr, value, tRow ) ) {

            // toast and resume
            return $.publish( 'toast', [2, 'SmartPigs Error: could not update row with ' + attr + ' : ' + value] );
          }
        }

        // save it into the database as well
        this
          .saveRow(tRow.toJSON())
          .then(function(){

            // refresh table
            return _self.refreshTable(table);
          })
          .then(function(){

            // get counter view
            var counter = _self.getView( '.footer-left' );

            // update counter
            var hasCheckmark = _self.model.get( 'hasCheckmark' );

            // define vars
            var _checkedRows, _selectedRows, _visibleRows;

            // check counter
            if ( counter ) {

              // location overview
              if ( isLocationOverview ) {

                // check if has checkmark
                if ( hasCheckmark ) {
                  _checkedRows  = table.getCheckedRows( true );
                  _selectedRows = table.getSelectedRows( true );

                  // update counter view
                  counter.update( 'selected', _checkedRows.length );
                  counter.update( 'total', _selectedRows.length );
                } else {

                  // get visible rows
                  _visibleRows = table.getVisibleRows();

                  // check number of visible rows
                  if ( isArray(_visibleRows) ) {

                    // update counter view
                    counter.update( 'total', _visibleRows.length );
                  }
                }
              } else {
                // folgeseddel
                _checkedRows = table.getRowsBy( 'marked', 1 );
                _selectedRows = table.getSelectedRows( true );

                // update counter view
                counter.update( 'selected', _checkedRows.length );
                counter.update( 'total', _selectedRows.length );
              }
            }
          });
      }
    }

    checkAnimalOnServer(attr, value, layout, full) {

      // save context
      var _self = this;

      // init server address
      var server_address = session.get( 'device', Const.SERVER_URL ) || '/';

      // define endpoint
      var _url = server_address + 'get.html?' + session.get( 'layouts', 'sessionKey' ) + '?HandleRemovedBreedProgeny';

      // axios post config
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      // define data
      var data = { requestKey: layout.requestKey };

      // check full
      if ( full ) {

        // adjust data
        data.layout = layout;
      }

      // update data
      data[attr] = value;

      // retuens a promise
      return axios
        .post(_url, data, config)
        .then(function(result) {

          // define response
          var response = result.data;

          // define modal dialog
          var alertDialog, onConfirm;

          // labels
          var u5 = session.get( 'sp_lang', 'SP_ButtonOk') || Language.button.ok[_self.lang];
          var u6 = session.get( 'sp_lang', 'SP_ButtonNo') || Language.button.no[_self.lang];

          // check response
          if ( !response ) {
            throw {
              type: 1,
              name: 'ServerError',
              message: 'no response'
            };
          }

          // check if result starts with !
          if ( typeof response == 'string' ) {

            // ! reponse
            if ( response.charAt(0) === '!' ) {

              // show error dialog
              alertDialog = AlertModal({
                title: 'ServerError',
                message: response.substring(1, response.length),
                confirm: u5,
                confirmVisible: true,
                cancelVisible: false
              });

              // define positive callback
              onConfirm = function() {

                // log
                console.log('modal hidden');
              };
            } else {

              // check first character
              if ( response.charAt(0) === '?' ) {

                // adjust response
                response = response.substring( 1, response.length );
              }

              // activate again
              alertDialog = AlertModal({
                title: 'Activate animal?',
                // removed the question mark
                message: response,
                cancel: u6,
                confirm: u5,
                confirmVisible: true,
                cancelVisible: true
              });

              // define positive callback
              onConfirm = function() {

                // send request
                _self.onReaderResult(null, attr, value, true);
              };
            }

            // listen for custom events
            alertDialog.on( 'hidden', _self.togglePopup, _self );
            alertDialog.on( 'visible', _self.togglePopup, _self );
            alertDialog.on('confirm', function(){

              // hide dialog
              this.hide(onConfirm);
            });

            // set modal view
            _self.setView( '.progeny-modal', alertDialog );

            // render alert modal
            alertDialog.render();

            // error
            return false;
          }

          // success
          return response;
        })
        .catch(function(err){

          // define more meaningfull message
          var msg;

          // handle axios error
          if (err.response) {

            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            // console.log(err.response.data);
            // console.log(err.response.status);
            // console.log(err.response.headers);
            msg = 'Timeout error or no connection! (status code not in 2xx range: ' + err.response.data + ')';
          } else if (err.request) {

            // The request was made but no response was received
            // `err.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            // console.log(err.request);
            msg = 'Request error: no response received!';
          } else {

            // check if custom error
            if( err.type ) {

              // redefine message
              msg = err.message;
            } else {

              // Something happened in setting up the request that triggered an Error
              // console.log('Error', err.message);
              msg = 'Timeout or no connection!';
            }
          }

          // log
          // console.log(err.config);

          // check axios response object schema
          // https://github.com/mzabriskie/axios#response-schema
          // response == undefined -> 404 (NetworkError)
          // console.log(response);

          // get connection type and custom error message
          // var connectionState = status == 'timeout' ? Const.NET_TIMEOUT : Const.NET_SERVER_DOWN;
          // var message = status == 'timeout' ? 'connection timeout' : 'no connection';

          // toast and resume
          $.publish( 'toast', [3, msg, {hideDuration: 20000}] );

          // reject promise
          throw {
            type: 5,
            name: 'RequestError',
            message: msg,
            connectionState: Const.NET_SERVER_DOWN
          };
        });
      // handle network error in the calling method
    }

    /**
     * @param  {Layout} dialog - dialog view
     * @param  {object} options - contains original event informations
     * @param  {Backbone.Model} tRow - working row
     * @return {[type]}         [description]
     */
    onPositive(dialog, options, tRow) {
      var _self = this;
      var table = this.getView( '.main-component' );

      // validate table and dialog view
      if ( !table || !dialog ) {

        // hide spinner
        return $.publish( 'spinner', [false] );
      }

      // get mode
      var mode = getProp( options, ['mode'] );

      // check mode
      switch( mode ) {
      case 'batch':

        // layout
        var layout = this.model.get( 'layout' );

        // update layout by row
        if ( !table.updateLayoutByRow( layout, tRow ) ) {

          // toast and resume
          return $.publish( 'toast', [2, 'SmartPigs Error: Could not update batch registration layout!'] );
        }

        // get updated rows back
        // bBatch -> true (to not check for batch flag. not ready on this nested layout)
        // var tRows = table.model.get( 'tRows' );
        var tRows = table.runBatch( tRow, true );

        // no row updated
        if ( !tRows.length ) {

          // toggle dialog
          dialog.toggle();

          // hide spinner
          return $.publish( 'spinner', [false] );
        }

        // locationOverview flag
        var locationOverview = getProp( layout, ['locationOverview'] );

        // update dirty
        this.model.set( 'dirty', true );

        // save rows into db and then refresh
        this
          .saveRows(tRows)
          .then(function(){

            // refresh table
            _self.refreshTable(table);
          })
          .then(function(){

            // get counter view
            var counter = _self.getView( '.footer-left' );

            // update counter
            var hasCheckmark = _self.model.get( 'hasCheckmark' );

            // define vars
            var _checkedRows, _selectedRows, _visibleRows;

            // check counter
            if ( counter ) {

              // location overview
              if ( locationOverview ) {

                // check if has checkmark
                if ( hasCheckmark ) {
                  _checkedRows  = table.getCheckedRows( true );
                  _selectedRows = table.getSelectedRows( true );

                  // update counter view
                  counter.update( 'selected', _checkedRows.length );
                  counter.update( 'total', _selectedRows.length );
                } else {

                  // get visible rows
                  _visibleRows = table.getVisibleRows();

                  // check number of visible rows
                  if ( isArray(_visibleRows) ) {

                    // update counter view
                    counter.update( 'total', _visibleRows.length );
                  }
                }
              } else {
                // folgeseddel
                _checkedRows = table.getRowsBy( 'marked', 1 );
                _selectedRows = table.getSelectedRows( true );

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

            // log
            console.warn( err );

            // hide spinner
            $.publish( 'spinner', [false] );

            // toast
            $.publish('toast', [2, 'SmartPigs ' + capitalize( Language.index.errorMsg6[_self.lang] ) + ': ' + err.message]);
          });
        break;
      default:
        break;
      }
    }

    // start listening for custom events
    startListening() {
      if ( this.listening ) return;

      // call parent method
      BaseView.prototype.startListening.call( this );

      // listen for custom events
      $.subscribe( 'update-view.locationoverview', this.onUpdateValue.bind(this) );
      $.subscribe( 'reader-result.locationoverview', this.onReaderResult.bind(this) );

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
      if ( !this.listening ) return;

      // call parent method
      BaseView.prototype.stopListening.call( this );

      // unsubscribe custom listeners
      $.unsubscribe( 'update-view.locationoverview' );
      $.unsubscribe( 'reader-result.locationoverview' );
    }

    // overwrite parent method
    cleanup(){

      // call parent method
      BaseView.prototype.cleanup.call( this );

      // disable reader
      // $.publish( 'android', ['reader', 0, 'multi'] );
    }
  };
};
