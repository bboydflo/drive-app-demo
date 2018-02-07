'use strict';

// libs
import getProp from 'get-prop';

// lodash functions
import { map, remove, isArray, capitalize, isPlainObject } from 'lodash';

// singleton vars
var log, loginApi;

// exports
export default ( $, axios, debug, Layout, Backbone, android, Const, DbConnection,
  Language, template, TableModel, ErrorModel, CounterModel, ConnectionModel, TableView,
  ErrorView, CounterView, ConnectionView, BluetoothModal, EditView, SortColumn,
  ProcessEvent, ProcessKeyup, onInputChange, LoginController, utils, session ) => {

  // return base view
  return class V extends Layout {

    constructor(o)  {
      super(o);

      // no element wrapping this view
      this.el = false;

      // templating function
      this.template = template; // Templates.hbs.progeny;

      // events
      this.events = {
        'keyup input.animal-serial': ProcessKeyup,
        'click button.animal-serial': ProcessKeyup,
        'click .dropdown-action': 'dropdownAction'
      };
    }

    // init
    initialize() {

      // init log
      log = debug( 'BaseView' );

      // init login api
      loginApi = loginApi || LoginController( session );

      // listen for error change
      this.listenTo( this.model, 'change:error', this.updateError );

      // listen for custom events
      // this.on( 'back', this.onBack, this );
      this.on( 'back', this.onBack.bind(this) );
      this.on( 'popup', this.togglePopup.bind(this) );
      this.on( 'bluetooth', this.onBluetooth.bind(this) );
      this.on( 'orientation-changed', this.onOrientationChanged.bind(this) );

      // top view popup state
      this.popup = false;

      // filter row
      this.filterRow = [];

      // listening for custom events
      this.listening = false;

      // table name
      this.tableName = 'layout';
    }

    // before render hook
    beforeRender() {
      var layout, tableObj, mainMode, requestKey,
        errorModel, tableModel, counterModel, connectionModel;

      // error component
      if ( !this.getView('.error-component') ) {

        // create error model
        errorModel = new ErrorModel();

        // set card view
        this.setView( '.error-component', new ErrorView({ model: errorModel, lang: this.lang }) );
      }

      var mainComponent = this.getView( '.main-component' );

      // labels
      var t1 = session.get( 'sp_lang', 'SP_ButtonFind') || Language.button.find[this.lang];

      // table component
      if ( !mainComponent ) {

        // init vars
        layout     = this.model.get( 'layout' );
        mainMode   = getProp( layout, ['mainMode'] );
        requestKey = getProp( layout, ['requestKey'] );

        // init table obj
        tableObj = {};

        // define table properties
        // replace( '/', '' ) or replace '/' globally with empty string
        // TODO: remove unauthorized characters
        tableObj.tHead  = layout.thead;
        // tableObj.tId    = requestKey.replace(/\//g, '');
        tableObj.tId    = requestKey;
        tableObj.tTitle = layout.menuTitle;
        tableObj.cRoute = layout.requestKey;

        // check sub mode
        // VERY IMPORTANT IN OTHER PARTS OF THE APP
        if ( mainMode >= 0 ) {

          // set table in checkmark mode
          tableObj.tCheck = true;
        }

        // on mainmode
        if ( mainMode == 1 ) {

          // update main model
          this.model.set( 'findAnimal', { placeholder: t1 });
        }

        // check if has checkmark column
        if ( layout.thead[layout.thead.length-1].th[0].iClick < 0 ) {

          // update model
          this.model.set( 'hasCheckmark', true );
        }

        // define table model
        tableModel = new TableModel( tableObj );

        // define table view
        mainComponent = new TableView({
          model: tableModel,
          lang: this.lang
        });

        // enable tooltips
        mainComponent.toggleTooltips();

        // add event listeners
        mainComponent.on( 'edit-table', EditView );
        mainComponent.on( 'toggle-check', this.onToggleCheck.bind(this) );
        mainComponent.on( 'remove-row', this.onRemoveRow.bind(this) );
        mainComponent.on( 'positive', this.onPositive.bind(this) );
        mainComponent.on( 'negative', this.onNegative.bind(this) );
        mainComponent.on( 'sort-table', this.onSort.bind(this) );
        mainComponent.on( 'open-card', this.openCard.bind(this) );
        mainComponent.on( 'toggle-all', this.toggleAll.bind(this) );

        // set event handlers
        mainComponent.setEventHandlers({
          // to catch "change" event on select input
          // useful to prevent event propagation
          'click .e-cell-input': onInputChange,
          'click select': onInputChange,

          // to catch "change" event on select input
          // read: https://stackoverflow.com/questions/785099/what-is-the-difference-between-onblur-and-onchange-attribute-in-html#785106
          'change select': onInputChange,
          // to catch "change" event on input
          'change .e-cell-input': onInputChange,
          // to catch "enter" event on input
          'keyup .e-cell-input': onInputChange,

          'click td': ProcessEvent,
          'contextmenu td': ProcessEvent,
          'hide td': ProcessEvent,
          'click .sort': SortColumn
        });

        // insert table view
        this.setView( '.main-component', mainComponent );
      }

      // counter component
      if( !this.getView('.footer-left') ) {

        // define counter model
        counterModel = new CounterModel( this.model.get('counter') );

        // set counter view
        this.setView( '.footer-left', new CounterView({ model: counterModel, lang: this.lang }) );
      }

      // connection component
      if( !this.getView('.footer-right') ) {

        // define connection model
        connectionModel = new ConnectionModel({ connection: this.isOnline() });

        // set connection view
        this.setView( '.footer-right', new ConnectionView({ model: connectionModel, lang: this.lang }) );
      }

      // init android
      $.publish( 'init-android' );
    }

    // overwrite render
    serialize() {

      // labels
      var t1 = session.get( 'sp_lang', 'SP_LabelsAction') || Language.labels.actions[this.lang];

      // template data
      return {
        title: getProp(this.model.get('layout'), ['menuTitle'], ''),
        findAnimal: this.model.get('findAnimal'),
        dropdown: this.dropdown || false,
        dropLabel: t1,
        actionList: this.actionList || [],
        divider: this.divider || false,
        separator: this.separator
      };
    }

    // after render hook
    afterRender() {

      // setup listeners for custom events
      this.startListening();
    }

    updateMode(readerMode) {

      // check if android
      if ( android && android.isInitialized() ) {

        // update mode
        return android.updateMode( readerMode );
      }
    }

    // get connection
    getConnection() {

      // get connection
      return DbConnection.then((connection) => connection);
    }

    isOnline() {

      // online/offline status
      return session.get( 'app', 'connection' ) == Const.NET_CONNECTED;
    }

    isDirty() {

      // resume
      return this.model.get( 'dirty' );
    }

    toggleFilter() {
      var table = this.getView( '.main-component' );

      // labels
      var t1 = session.get( 'sp_lang', 'SP_LabelsFilter') || Language.labels.filter[this.lang];
      var t2 = session.get( 'sp_lang', 'SP_ButtonOk') || Language.button.ok[this.lang];
      var t3 = session.get( 'sp_lang', 'SP_ButtonCancel') || Language.button.cancel[this.lang];

      // get dialog view
      var dialogView = table.openFilterDialog({
        mode: 'filter',
        icon: 'glyphicon-filter',
        title: t1,
        filterRow: this.filterRow,
        lang: this.lang,
        positiveTitle: capitalize(t2),
        negativeTitle: t3
      });

      // validate dialog view
      if ( dialogView ) {

        // setup listeners
        dialogView.on( 'visible', this.togglePopup, this );
        dialogView.on( 'hidden', this.togglePopup, this );

        // set dialog view
        this.setView( '.progeny-modal', dialogView );

        // render dialog view
        dialogView.render();
      }
    }

    filterRows() {
      var table = this.getView( '.main-component' ),
        currentRows = table.model.get( 'tRows' );

      // check filter row
      if ( this.filterRow.length ) {

        // apply each filter on the current rows
        map(this.filterRow, (fRow) => {

          // map again through current rows
          map(currentRows, function(tRow){
            var value = tRow.data[ fRow.col ] + '';
            if ( value.toLowerCase() !== fRow.val ) {
              tRow.selected = 0;
            }
          });
        });
      } else {

        // clear filters
        map(currentRows, function(tRow){ tRow.selected = 1; });
      }

      // update table component
      table.model.set( 'tRows', currentRows );

      // update scroll
      table.$( '.sm-table-body' ).scrollTop( 0 );

      // refresh table
      return this
        .refreshTable(table)
        .then(() => currentRows);
    }

    togglePopup(popup) {

      // check popup state
      if ( typeof popup == 'undefined' ) {

        // update popup flag
        this.popup = !this.popup;
      } else {

        // get state from the upper component
        this.popup = popup;
      }
    }

    /**
     * handle dropdown action
     */
    dropdownAction(event) {
      event.preventDefault();
      event.stopPropagation();

      // call appropriate handler
      switch( $(event.target).data('event') ) {
      case 'create':
        this.onCreate();
        break;
      case 'back':
        this.onBack();
        break;
      case 'batch-registration':
        this.onBatchDialog();
        break;
      case 'filter':
        this.toggleFilter();
        break;
      }
    }

    // common api
    updateConnection(connection) {

      // get connection view
      var connectionView = this.getView( '.footer-right' );

      // validate view
      if ( !connectionView ) return false;

      // update connection view
      connectionView.model.set( 'connection', connection );

      // publish connection change event
      $.publish( 'connection-change', [connection] );

      // resume
      return true;
    }

    // common api
    updateError() {
      var errorView = this.getView( '.error-component' );

      // no error subview
      if ( typeof errorView == 'undefined' ) {

        // create error model
        var errorModel = new ErrorModel();

        // create error view
        errorView = new ErrorView({ model: errorModel, lang: this.lang });

        // update error in the current view
        this.setView( '.error-component', errorView );
      } else {

        // update error view model
        errorView.model.set( this.model.get('error') );
      }

      // rerender old view
      errorView.render();
    }

    // common api
    // increment selected items in the counter view
    incrementSelected() {
      if ( this.model.get('hasCheckmark') ) {

        // get counter view
        var counterView = this.getView( '.footer-left' );

        // increment selected
        counterView.inc( 'selected' );
      }
    }

    // common api
    // decrement selected items in the counter view
    decrementSelected() {
      if ( this.model.get('hasCheckmark') ) {

        // get counter view
        var counterView = this.getView( '.footer-left' );

        // increment selected
        counterView.decr( 'selected' );
      }
    }

    // common api
    // update counter view (selected rows)
    updateSelected(selectedRows) {
      if ( this.model.get('hasCheckmark') ) {

        // get counter view
        var counterView = this.getView( '.footer-left' );

        // increment selected
        counterView.update( 'selected', selectedRows );
      }
    }

    /**
     * on toggle check single row
     * @param  {object} options - toggle options
     * @return {[type]}         [description]
     */
    onToggleCheck(options) {

      // check value
      if ( getProp(options, ['checked']) ){

        // increment
        this.incrementSelected();
      } else {

        // decrement
        this.decrementSelected();
      }

      var layout = this.model.get( 'layout' ),
        subMode = getProp( layout, ['subMode'] );

      // get table
      var table = this.getView( '.main-component' );

      // check subMode
      if ( subMode < 2 ) {

        // get row by id
        var tRow = table.getRowsBy( 'id', options.rowId, true );

        // validate row
        if ( !tRow ) {

          // toast and resume
          return $.publish( 'toast', [2, 'SmartPigs Error: table row with id = ' + options.rowId + ' could not be found @TableCellEventHandler()!'] );
        }

        // could not update
        if ( !table.updateRowBy( 'id', options.rowId, tRow ) ) {

          // reject promise
          throw {
            type: 6,
            source: 'SmartPigs',
            message: 'could not update row with id ' + options.rowId + ' @localUpdate!'
          };
        }

        // save row into database (returns promise)
        this
          .saveRow(tRow.toJSON())
          .then(function() {

            // check if store is not dirty
            if ( !session.get( 'dirty', layout.requestKey ) ) {

              // update dirty
              session.set( 'dirty', layout.requestKey, 1 ).persist();
            }
          })
          .catch( this.handleError.bind(this) );

        // resume
        return;
      }

      // TODO
      // trigger edit view

      // labels
      var t1 = session.get( 'sp_lang', 'SP_ButtonEditRow') || Language.button.editRow[this.lang];
      var t2 = session.get( 'sp_lang', 'SP_ButtonOk') || Language.button.ok[this.lang];
      var t3 = session.get( 'sp_lang', 'SP_ButtonCancel') || Language.button.cancel[this.lang];

      // update options
      options.mode          = 'edit';
      options.icon          = 'glyphicon-edit';
      options.check         = true;
      options.title         = t1;
      options.lang          = this.lang;
      options.positiveTitle = capitalize( t2 );
      options.negativeTitle = t3;

      // get dialog view
      var dialogView = table.openNewRowDialog( options );

      // validate dialog view
      if ( dialogView ) {

        // setup listeners
        dialogView.on( 'visible', this.togglePopup, this );
        dialogView.on( 'hidden', this.togglePopup, this );

        // set dialog view
        this.setView( '.progeny-modal', dialogView );

        // render dialog view
        dialogView.render();
      }
    }

    /**
     * on toggle check all rows
     * @param  {object} event - jquery event
     * @return {[type]}       [description]
     */
    toggleAll() {
      var table     = this.getView( '.main-component' ),
        toggleState = table.model.get( 'toggleAll' );

      // toggle check all
      if ( table.toggleAll(toggleState) === undefined ) return;

      // TODO: split in two reusable functions
      // split below functionality in another function

      // get rows
      var tRows = table.model.get( 'tRows' );

      // check if any dirty rows
      if ( !tRows.length ) return;

      // save table in the database
      return this
        .saveRows(tRows)
        .then(() => {

          // get counter view
          var counter = this.getView( '.footer-left' );

          // check counter
          if ( counter ) {

            // update counter
            var hasCheckmark = this.model.get( 'hasCheckmark' );

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
        .then(() => {

          // refresh table
          this.refreshTable(table);
        })
        .catch((err) => {

          // hide spinner
          $.publish( 'spinner', [false] );

          // toast
          $.publish('toast', [2, 'SmartPigs ' + capitalize( Language.index.errorMsg6[this.lang] ) + ': ' + err.message]);
        });
    }

    /**
     * generic on negative dispatch handler
     * @param  {Layout} dialog - dialog view
     * @return {[type]}        [description]
     */
    onNegative(dialog) {

      // validate dialog
      if ( dialog ) {

        // hide dialog
        dialog.toggle();
      }
    }

    /**
     * on sort handler
     * @param  {Object} opt - sorting options
     * @return {undefined}
     */
    onSort(opt) {
      var table = this.getView( '.main-component' );

      // todo
      // validate options

      // sort column by index
      if ( !table.sortColumnByIndex(opt) )  return;

      // rerender table view
      table.render();
    }

    /**
     * process error
     * => improve process error functionality on progeny core
     */
    onProcessError(event, tableId, options) {
      event.stopPropagation();

      // get table component
      var table = this.getView( '.main-component' );

      // get table model
      var tableModel = table.model.toJSON();

      // get column nume
      var colName = tableModel.tHead[tableModel.properties.lastHeaderIdx].th[options.cIndex].sTitle;

      // labels
      var t1 = session.get( 'sp_lang', 'SP_IndexErrorMsg6') || Language.index.errorMsg6[this.lang];
      var t2 = session.get( 'sp_lang', 'SP_Toast2') || Language.toast['2'][this.lang];
      var t3 = session.get( 'sp_lang', 'SP_Toast3') || Language.toast['3'][this.lang];

      // define error
      var error = {
        visible: true,
        title: 'SmartPigs ' + capitalize( t1 ) + ': '
      };

      switch( options.iClick ) {

      // number
      case 1:
      case 4:
      case 7:

        // define error message
        error.message = '"' + options.newValue + '"' + t2 +  '"' + colName +  '". ' + t3;
        break;
      default:

        // define error message
        error.message = 'Edit Error!';
        break;
      }

      // update error
      this.model.set( 'error', error );
    }

    /**
     * [onBluetooth handler]
     * @return {[type]} [description]
     */
    onBluetooth() {

      // get active modal
      var btModal = this.getView( '.progeny-modal' );

      // check if active modal is a bluetooth modal
      if ( btModal && btModal instanceof BluetoothModal ) {

        // toggle bluetooth modal
        btModal.toggle();

        // resume
        return;
      }

      // create login modal
      btModal = new BluetoothModal( this.lang );

      // listen for custom events
      btModal.on('visible', this.togglePopup, this );
      btModal.on('hidden', this.togglePopup, this );

      // set dialog view
      this.setView( '.progeny-modal', btModal );

      // render session modal and resume
      btModal.render();
    }

    onOrientationChanged() {

      // get main component
      var mainComponent = this.getView( '.main-component' );

      // table component
      if ( !mainComponent ) return;

      // trigger orientation change on table component
      mainComponent.changeOrientation();
    }

    /**
     * get data main method
     * @param  {object} obj [description]
     * @return {[type]}     [description]
     */
    getData(obj) {

      // show spinner
      $.publish( 'spinner', [true] );

      return this
        .fetchData(obj)
        .then((resp) => {

          // check response type
          if ( isPlainObject(resp) ) throw resp;

          // return a promise
          return this.updateView( resp[0], resp[1], resp[2] );
        })
        .catch( this.fetchFailed.bind(this) );
    }

    /**
     * fetch data helper
     * @param  {object} obj - [description]
     * @return {[type]}     [description]
     */
    fetchData(obj) {
      var endPoint = obj.endPoint || getProp( obj, ['layout', 'requestKey'] ),
        layoutKey = obj.layoutKey || getProp( obj, ['layout', 'requestKey'] );

      // should fetch data from the database
      var fromDb = getProp( obj, ['layout', 'database'], false );

      // get connection state
      var isOnline = this.isOnline();

      // check connection
      if( isOnline && !fromDb ){

        // init server address
        var server_address = session.get( 'device', Const.SERVER_URL ) || '/';

        // define endpoint
        var _url = server_address + 'get.html?' + session.get( 'layouts', 'sessionKey' ) + '?' + endPoint;

        // define data
        var data = utils.getLayoutBy( 'requestKey', layoutKey );

        // axios post config
        var config = {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        };

        return axios
          .post(_url, data, config)
          .then((response) => {
            return this
              .processResponse(response.data, {
                isOnline: isOnline,
                layout: obj.layout,
                endPoint: endPoint
              });
          })
          .catch(() => {

            // rethrow connection error
            throw {
              type: 4,
              name: 'ConnectionError',
              message: capitalize( 'no connection' ) + '!',
              connectionState: Const.NET_SERVER_DOWN
            };
          });
      }

      // get db connection
      return this
        .getConnection()
        .then((connection) => {

          // get visible rows from the local database using db connection
          return connection.getRowsBy( this.tableName, {layout: endPoint, hidden: 0} );
        })
        .then((response) => {

          // process response
          return this.processResponse( response, obj.layout );
        });
    }

    // process online response
    processOnlineResponse(response) {

      // check result
      if ( !response ) {

        // throw custom error
        return {
          type: 0,
          name: 'Server',
          message: 'No response!'
        };
      }

      // error
      if ( response[0] == '!' ) {

        // update message
        response = response.substring( 1, response.length );

        // expired session
        if ( response == 'nouser' ) {

          // reject promise and resume
          return {
            type: 1,
            name: 'Server',
            message: response
          };
        }

        // reject promise and resume
        throw {
          type: 2,
          name: 'Server',
          message: response
        };
      }

      // add support for report list response
      if ( response.substring( response.length - 3 ) == 'pdf' ) {

        // resolve promise
        return [ response, undefined ];
      }

      // check if it's valid reponse
      if ( !isPlainObject(response) ) {

        // reject promise and resume
        return {
          type: 1,
          name: 'Server',
          message: response
        };
      }

      // resume
      return response;
    }

    // process ffline response
    processOfflineResponse(response) {

      // log
      console.log(response);
    }

    // used for processing both online/offline responses
    processResponse() {

      // keep refference to this view
      var _self = this;

      // get arguments
      var args = Array.prototype.slice.call( arguments );

      // define vars
      var rows, animals, layout;

      // get response and options
      var response = args[ 0 ];
      var options  = args[ 1 ];

      // check result
      if ( !response ) {

        // throw custom error
        return {
          type: 0,
          name: 'Server',
          message: 'No response!'
        };
      }

      // get main mode
      var mainMode = getProp( options, ['mainMode'], false );

      // labels
      var t1 = session.get( 'sp_lang', 'SP_LabelsFindAnimal') || Language.labels.findAnimal[_self.lang];

      // is plain object?
      if ( isPlainObject(response) ){

        // check for animals rows
        animals = getProp( response, ['animals', 'tr'], [] );

        // main mode
        if ( mainMode == 1 ) {

          // if any animals
          if ( animals.length ) {

            // update progeny model
            _self.model.set( 'findAnimal', {placeholder: t1} );
          }
        } else {

          // get table rows
          rows = getProp( response, ['tr'], [] );
        }

        // normalize rows
        rows = map( rows, function(row){

          // add layout key
          row.layout = options.layout.requestKey;

          // resume
          return TableView.prototype.normalizeRow(row);
        });

        // normalize animals
        animals = map( animals, function(row){

          // add layout key
          row.layout = options.layout.requestKey;

          // make animals hidden by default
          // row.hidden = 1;
          // make row as an animal row
          row.animal = 1;

          // resume
          return TableView.prototype.normalizeRow(row);
        });

        // check for new layout
        layout = getProp( response, ['layout'], options.layout );

        // resolve promise
        return [ rows, layout, animals ];
      }

      // offline mode -> process response from the database
      // check if it's array. use jquery because it's already available
      if ( isArray(response) ){

        // main mode -> find mode
        if ( mainMode == 1 ) {

          // split data into normal rows and animal rows
          rows = remove(response, function(r) {

            // remove normal rows
            return r.animal === 0;
          });

          // resolve promise (using response and layout) then resume
          // return [ [], options, response ];
          return [ rows, options, response ];
        }

        // resolve promise (using response and layout) then resume
        return [ response, options, [] ];
      }

      // add support for report list response
      if ( response.substring( response.length - 3 ) == 'pdf' ) {

        // resolve promise
        return [ response, undefined ];
      }

      // error
      if ( response[0] == '!' ) {

        // expired session
        if ( response == '!nouser' ) {

          // reject promise and resume
          return {
            type: 1,
            name: 'Server',
            message: response,
            layout: options.layout,
            endPoint: options.endPoint
          };
        }

        // update message
        response = response.substring( 1, response.length );

        // reject promise and resume
        return {
          type: 2,
          name: 'Server',
          message: response
        };
      }

      // not found
      if ( response == 'notfound' ) {

        // reject promise and resume
        return {
          type: 2,
          name: 'Server',
          message: 'Not found!'
        };
      }

      // resume
      return response;
    }

    fetchFailed(err) {

      // get error type
      var errType = getProp( err, ['type'], -1 );

      // session expired
      if ( errType == 1 ) {

        // hide spinner
        $.publish( 'spinner', [false] );

        // session expired
        return $.publish('session-expired', () => {

          // get data
          this
            .getData({
              endPoint: err.endPoint,
              layout: err.layout
            })
            .then(() => {

              // hide spinner
              $.publish( 'spinner', [false] );
            });
        });
      }

      // connection error
      if ( errType == 4 ) {

        // update connection
        this.updateConnection( false );
      }

      // handle/print error
      this.handleError( err );
    }

    updateView(rows, layout, animals) {

      // get table component
      var tableView = this.getView( '.main-component' );

      // no new layout
      layout = layout ? layout : this.model.get( 'layout' );

      // log
      log( rows );
      log( layout );

      // find mode
      if ( getProp(layout, ['mainMode']) == 1 ) {

        // resume
        return Promise.resolve([ rows, layout, animals ]);
      }

      // update model
      tableView.model.set({ tRows: rows });

      // refresh table
      return this
        .refreshTable(tableView)
        .then(() => [ rows, layout, animals ]);
    }

    /**
     * sync single row
     * @param  {object} row - row object
     * @return {promise} - ajax request promise
     */
    syncRow(row) {
      var layout = this.model.get( 'layout' );
      var data = {
        tr: [],
        layout: layout
      };

      // if row is an array
      if ( isArray(row) ) {

        // resume early
        if ( !row.length ) return Promise.resolve();

        // update data rows
        data.tr = row;
      } else {

        // update data row
        data.tr.push( row );
      }

      // init server address
      var server_address = session.get( 'device', Const.SERVER_URL ) || '/';

      // cookie
      var cookie = '';

      // check cookie
      if ( this.todo ) {

        // update cookie
        cookie = '?' + this.todo;
      }

      // define endpoint
      var url = server_address + 'send.html?' + session.get( 'layouts', 'sessionKey' ) + '?' + layout.requestKey + cookie;

      // axios post config
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      return axios
        .post(url, data, config)
        .then((response) => {

          // check typeof response
          if ( typeof response.data == 'string' && response.data[0] == '!' ) {

            // hide spinner
            $.publish( 'spinner', [false] );

            // expired session
            if ( response.data == '!nouser' ) {

              // reject promise and resume
              throw {
                type: 1,
                name: 'ServerError',
                message: response.data,
                requestKey: layout.requestKey,
                layout: layout.layoutKey
              };
            }

            // update message
            var message = response.data.substring( 1, response.data.length );

            // reject promise and resume
            throw {
              type: 2,
              name: 'ServerError',
              message: message
            };
          }

          // publish connection change event
          $.publish( 'connection-change', [Const.NET_CONNECTED] );

          // resolve promise
          return response.data;
        })
        .catch((err) => {

          // get error type
          var errType = getProp( err, ['type'], -1 );

          // check error type
          if ( errType > 0 ) throw err;

          // publish connection change event
          $.publish( 'connection-change', [Const.NET_SERVER_DOWN] );

          throw {
            type: 4,
            name: 'ConnectionError',
            message: capitalize( 'no connection' ) + '!',
            connectionState: Const.NET_SERVER_DOWN
          };
        });
    }

    /**
     * save row into database store. should be moved out of table api
     * @param  {number|boolean} rIndex  - index of row to be saved
     * @param  {string} dbStore - database store in which row should be saved
     * @param  {function} cb - optional callback to be executed if operation success
     * @return {promise} - async operation should return a promise
     */
    saveRow(tRow) {

      // persist in the database
      return this
        .getConnection()
        .then((connection) => {

          // resume
          return connection.updateRow( this.tableName, tRow );
        });
    }

    /**
     * save all table rows into database store. should be moved out of table api
     * @param  {string}   dbStore - database store
     * @param  {function} cb - callback to execute if operation success
     * @return {promise} - async operation should return a promise
     */
    saveRows(tRows) {

      // get db connection
      return this
        .getConnection()
        .then((connection) => {

          // use db connection
          return connection.updateRows( this.tableName, tRows );
        });
    }

    handleError(err) {
      var errSource = getProp( err, ['name'], 'Database' );

      // hide spinner
      $.publish( 'spinner', [false] );

      // update error and resume
      this.model.set( 'error', {
        visible: true,
        title  : errSource + ': ',
        message: err.message
      });
    }

    // update locally
    localUpdate(options, dbStore, tRow, saveDirty) {
      var table = this.getView( '.main-component' );

      // no table view -> toast and resume
      if ( !table ) return $.publish( 'toast', [2, 'could not get ".main-component" @localUpdate'] );

      // save row into database (returns promise)
      return this
        .saveRow(tRow.toJSON())
        .then(() => {

          // could not update
          if ( !table.updateRowBy( 'id', options.rowId, tRow ) ) {

            // reject promise
            throw {
              type: 6,
              source: 'SmartPigs',
              message: 'could not update row with id ' + options.rowId + ' @localUpdate!'
            };
          }

          // check if store is not dirty
          if ( saveDirty && !session.get( 'dirty', dbStore ) ) {

            // update dirty
            session.set( 'dirty', dbStore, 1 ).persist();
          }

          // clear any previous errors
          this.model.set({
            error: {
              visible: false,
              title: '',
              message: ''
            },
            dirty: true
          });

          // refresh table
          return this.refreshTable(table);
        })
        .then(() => {

          // get counter view
          var counter = this.getView( '.footer-left' );

          // check counter
          if ( counter && table ) {

            // update counter
            var hasCheckmark = this.model.get( 'hasCheckmark' );

            // has checkmark
            if ( hasCheckmark ) {
              var _checkedRows  = table.getCheckedRows( true );
              var _selectedRows = table.getSelectedRows( true );

              // update counter view
              counter.update( 'selected', _checkedRows.length );
              counter.update( 'total', _selectedRows.length );
            }
          }

          // edit next cell
          table.editNextCell( options.rIndex + 1, options.cIndex );

          // resolve promise
          return null;
        })
        .catch( this.handleError.bind(this) );
    }

    clearStore(storeName) {

      // get table name
      var tableName = this.tableName;

      // get db connection
      return this
        .getConnection()
        .then((connection) => {

          // use db connection
          return connection.clearStoreBy( tableName, {layout: storeName} );
        })
        .then(() => {

          // log
          log( storeName + ' store cleared' );

          // resume
          return true;
        })
        .catch((err) => {

          // toast
          $.publish( 'toast', [2, 'error @emptyStore(\''+ storeName +'\'): ' + err.toString()] );
        });
    }

    // re-renders main component and re-attaches
    // event handlers
    refreshTable(table){
      return new Promise((resolve) => {
        table = table || this.getView( '.main-component' );

        // render table view
        return table
          .render()
          .promise()
          .done(function(){

            // resolve promise
            resolve( null );
          });
      });
    }

    openCard(options) {
      var cardNumber = getProp( options, ['number'] );

      if ( !cardNumber ) return;

      // offline
      if ( !this.isOnline() ) {

        // get previous route
        var requestKey = getProp( this.model.get('layout'), ['requestKey'], '' );

        // navigate to sowcard view
        Backbone.history.navigate( 'wc/' + requestKey + '/ASData_SowCard/' + cardNumber, { trigger: true } );
      } else {
        loginApi
          .checkStatus(session)
          .then(() => {

            // get previous route
            var requestKey = getProp( this.model.get('layout'), ['requestKey'], '' );

            // navigate to sowcard view
            Backbone.history.navigate( 'wc/' + requestKey + '/ASData_SowCard/' + cardNumber, { trigger: true } );

            // resolve
            return true;
          })
          .catch((err) => {
            var errSrc = getProp( err, ['name'], 'UnknownSource' );
            var errType = getProp( err, ['type'], -1 );
            var errMessage = getProp( err, ['message'], 'unknown error' );

            // check error type
            if ( errType == 1 ) {

              // session expired
              $.publish('session-expired', () => {

                // open card
                this.openCard( options );
              });
            } else {

              // toast
              $.publish( 'toast', [2, errSrc + ': ' + errMessage] );
            }

            // progress = false
            $.publish( 'progress', [false] );

            // log
            console.log( err );
          });
      }
    }

    isListening() {
      return this.listening;
    }

    // start listening for custom events
    startListening() {

      // is already listening
      if ( this.isListening() ) return;

      // subscribe to edit-error events
      $.subscribe( 'update-error.baseview', this.onProcessError.bind(this) );

      // update listening flag
      this.listening = true;
    }

    // stop listening for custom events
    stopListening() {

      // is not listening
      if ( !this.isListening() ) return;

      // unsubscribe listeners
      $.unsubscribe( 'update-error.baseview' );

      // update listening flag
      this.listening = false;
    }

    // needs to be extended by calling prototype method in subviews
    cleanup(){

      // stop listening for custom events
      this.stopListening();
    }
  };
};
