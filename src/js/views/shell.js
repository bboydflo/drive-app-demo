'use strict';

// libs
import getProp from 'get-prop';

// lodash helpers
import { map, assign, filter, isString, isFunction, capitalize, isPlainObject } from 'lodash';

// top view factory
export default ($, debug, Layout, Backbone, env, utils, session, Const,
  Language, template, MenubarModule, MenubarModel, TableView, LoginModal,
  DownloadModal, SyncModalView, LogoutModalView, MenubarView, AlertModal,
  SettingsModal, DbConnection, LoginController, android) => {

  // local module vars
  var log, menuModule,
    errorQueue = [];

  // return top view instance
  return class V extends Layout {

    constructor(o) {
      super(assign({

        // define wrapper element
        el: '#page-container',

        // define template
        template: template,

        // custom events object
        evs: {},

        // default app state
        appState: {

          // current page name
          pageName: 'index',

          // fade in/out duration
          fadeInMs: 0,
          fadeOutMs: 0,

          // dialog type. true -> can be manually hidden, false -> cannot be manually hidden
          popupType: true,

          // global in progress state
          inProgress: false
        }
      }, o));
    }

    initialize(appState) {

      // init logging
      log = debug( 'TopView' );

      // init app state
      assign(this, {appState: appState});

      // subscribe for spinner events
      $.subscribe( 'spinner', this.onSpinner.bind(this) );

      // subscribe for progress events
      $.subscribe( 'progress', this.onProgress.bind(this) );

      // subscribe for 'android-back' events
      $.subscribe( 'android-back', this.onBack.bind(this) );

      // subscribe for 'menu-back' events
      $.subscribe( 'menu-back', this.onBack.bind(this) );

      // listen for 'toggle-connection' events
      $.subscribe( 'toggle-connection', this.onToggleConnection.bind(this) );

      // listen for 'logout' events
      $.subscribe( 'logout', this.onLogout.bind(this) );

      // listen for 'menu-settings' eventa
      $.subscribe( 'menu-settings', this.onSettings.bind(this) );

      // listen for 'bluetooth' events
      $.subscribe( 'bluetooth', this.onBluetooth.bind(this) );

      // listen for 'language-change' events
      $.subscribe( 'language-change', this.onLanguageChange.bind(this) );

      // listen for 'reset' events
      $.subscribe( 'reset', this.onReset.bind(this) );

      // listen for connection changes
      $.subscribe( 'connection-change', this.onConnectionChanged.bind(this) );

      // listen for toggle logging events
      $.subscribe( 'toggle-logging', this.onToggleLogging.bind(this) );

      // listen for toggle logging events
      $.subscribe( 'session-expired', this.onSessionExpired.bind(this) );

      // check if it is android
      if ( android ) {

        // listen for 'init-android' event
        $.subscribe( 'init-android', this.onInitAndroid.bind(this) );
      }

      // listen for 'handle-logout' events
      this.on( 'handle-logout', this.logoutHandler, this );

      // init menu module
      menuModule = MenubarModule(MenubarView, MenubarModel, {
        lang: appState.lang,
        connection: appState.connection
      });
    }

    // before render hook
    beforeRender() {

      // create menubar
      this.setView( 'nav', menuModule.getView() );
    }

    // after render hook
    afterRender() {

      // subscribe for 'update-app' events
      $.subscribe( 'update-app', this.updateApp.bind(this) );
    }

    getConnection() {

      // get connection
      return DbConnection.then((connection) => connection);
    }

    // on update app dialog
    // updateApp(ev, app_name) {
    updateApp() {

      // get top view language
      var lang = this.getState( 'lang' );

      // labels
      var b1 = session.get( 'sp_lang', 'SP_ButtonUpdate') || Language.button.update[lang];
      var b2 = session.get( 'sp_lang', 'SP_ButtonCancel') || Language.button.cancel[lang];
      var b3 = session.get( 'sp_lang', 'SP_ButtonUpdate') || Language.button.update[lang];
      var b4 = session.get( 'sp_lang', 'SP_Toast21') || Language.toast[21][lang];

      // show error dialog
      var updateDialog = AlertModal({
        title: capitalize( b1 + ' SmartPigs!' ),
        message: 'Click update to get the latest compatible Android SmartPigs app!',
        cancel: b2,
        confirm: capitalize( b3 ),
        confirmVisible: true,
        cancelVisible: false,
        xModal: false
      });

      // listen for custom events
      updateDialog.on( 'visible', () => {

        // toggle popup
        this.togglePopup();

        // update popup type
        this.setState( 'popupType', false );
      });
      updateDialog.on( 'hidden', this.togglePopup, this );
      updateDialog.on( 'confirm', () => {

        // on mobile
        if ( android ) {

          // get device type
          var deviceType = session.get( 'device', Const.DEVICE_TYPE );

          // get device source
          var deviceSource = session.get( 'device', Const.SOURCE_CODE );

          // check device type
          if ( deviceType <= 0 && typeof deviceSource == 'undefined' ){

            // toast and resume
            return $.publish( 'toast', [0, b4, {hideDuration: 20000}] );
          }
        }

        // cache link
        var $updateLink = document.getElementById( 'update-app' );

        // update link value
        var server_address = session.get( 'device', Const.SERVER_URL ) || '/';

        // define apk real url
        $updateLink.href = server_address + 'sPigs.apk';

        // click on update-app
        $updateLink.click();
      });

      // insert dialog in 'generic-modal' placeholder
      this.setView( '.generic-modal', updateDialog );

      // render alert modal
      updateDialog.render();
    }

    onInitAndroid() {

      // android is already initialized -> resume
      if ( android.isInitialized() ) return;

      // init android module
      android.initialize();
    }

    // onSpinner( e, toggle ) {
    onSpinner(e, toggle) {

      // check current state
      if ( env.spinner.state == toggle ) return;

      // update progress
      this.inProgress = toggle;

      // check toggle state
      if ( toggle ) {
        env.spinner.show();
      } else {
        env.spinner.hide();
      }
    }

    onProgress(e, inProgress) {

      // toggle in progress
      this.inProgress = inProgress;
    }

    onBack() {
      var topView = this.getView( '#page-content' );

      // check top view
      if ( !topView ) {
        return $.publish( 'toast', [2, 'Could not get view @TopView->onBack!'] );
      }

      // check if in progress
      if ( this.inProgress ) {

        // log
        console.log( 'in progress...' );

        // resume
        return;
      }

      // check if popup active
      if ( this.getState('popup') ) {

        // check popup type
        if ( this.getState('popupType') ) {

          // hide active dialog
          this.hideDialog();
        }

        return;
      }

      // trigger generic back event
      topView.trigger( 'back' );
    }

    // on toggle connection handler
    onToggleConnection(ev, onlineState) {
      var isOnline,
        _ctx = this,
        layouts = session.get( 'layouts' );

      // get session key
      // var sessionKey = session.get( 'layouts', 'sessionkey' );
      var sessionKey = layouts.sessionKey;

      // check online state
      if ( typeof onlineState == 'undefined' ) {
        isOnline = session.get( 'app', 'connection' ) == Const.NET_CONNECTED;
      } else {
        isOnline = onlineState;
      }

      // progress = true
      this.inProgress = true;

      // attempt to login
      var loginApi = LoginController( session );

      // on login success callback
      loginApi
        .checkStatus(session)
        .then(() => {

          // update connection state
          session.set( 'app', 'connection', Const.NET_CONNECTED ).persist();

          // trigger offline mode
          menuModule.updateModel({ connection: Const.NET_CONNECTED });

          // resume
          return;
        })
        .then(() => {

          // offline
          if ( !isOnline ) {

            // sync instead
            return this.sync( this.clearTables.bind(this) );
          }

          // define sides
          var sides = ['left', 'center', 'right'];

          // define request queue
          var requestQueue = [];

          // map through sides collection
          map(sides, function(side){

            // map through each side and check if each layout has a valid offline key
            var f = filter(layouts[side].items, function(item){

              // check for offline key
              if ( getProp(item, ['offLineKey']) ) {

                // update request queue
                return item;
              }

              // filter condition
              return false;
            });

            // concat result
            requestQueue = requestQueue.concat( f );
          });

          // check arrays length
          if ( requestQueue.length ) {

            // get top view language
            var lang = this.getState( 'lang' );

            // get download modal
            var downloadModal = DownloadModal( lang );

            // listen for custom events
            downloadModal.on( 'hidden', this.togglePopup, this );
            downloadModal.on( 'visible', this.togglePopup, this );
            downloadModal.on( 'visible', function(){

              // update in progress
              _ctx.inProgress = true;

              // start timer
              var startTime = new Date().getTime();

              // loop through each layout in the request queue
              var requests = map(requestQueue, (layout, idx) => {

                // request #idx data for sessionKey
                log('request #' + idx + ' data for ' + layout.requestKey);

                /*// development only
                // do not continue to request data if one of the requests fails
                if ( true && layout.requestKey == 'ASData_PGEntry' ) {
                  return Promise.reject({
                    type: 10,
                    message: 'Custom SmartPigs development only error!'
                  });
                }*/

                // return a promise
                return _ctx.requestData( sessionKey, layout );
              });

              // loop through each request
              var downloadOperation = Promise.each(requests, (response, idx) => {

                // log
                log('received data from: ' + requestQueue[idx].requestKey );

                /*// development only
                if ( true && requestQueue[idx].requestKey == 'ASData_BreedingCard' ) {
                  return Promise.reject({
                    type: 10,
                    message: 'Custom SmartPigs development only error!'
                  });
                }*/

                // save to store
                return _ctx.saveToStore( requestQueue[idx], response );
              });

              // handle download operation errors
              downloadOperation
                .then(() => {

                  // log
                  log( 'download done' );

                  // progress = false
                  _ctx.inProgress = false;

                  // update connection state
                  session.set( 'app', 'connection', Const.NET_OFFLINE ).persist();

                  // trigger offline mode
                  menuModule.updateModel({ connection: Const.NET_OFFLINE });

                  // toggle dialog
                  this.toggle();

                  /*// development only
                  if ( true ) {
                    return Promise.reject({
                      type: 10,
                      message: 'Custom SmartPigs development only error!'
                    });
                  }*/

                  // calculate download timeout
                  var endTime = new Date().getTime();
                  var SecFromT1ToT2 = ( endTime - startTime ) / 1000;
                  var SecondsBetweenDates = Math.abs( SecFromT1ToT2 );

                  // log
                  log( 'seconds from startTime to endTime = ' + SecFromT1ToT2 );
                  log( 'seconds between startTime and endTime = ' + SecondsBetweenDates );
                })
                .catch((err) => {

                  // progress = false
                  _ctx.inProgress = false;

                  // log
                  console.log( err );

                  // labels
                  var b1 = session.get( 'sp_lang', 'SP_IndexErrorMsg6') || Language.index.errorMsg6[lang];
                  var b2 = session.get( 'sp_lang', 'SP_ButtonCancel') || Language.button.cancel[lang];

                  // define error message
                  var errorMessage = err.source + ' ' + b1 + ': ' + err.message;

                  // check if dialog exists
                  if ( !this || !this.isVisible() ) {

                    // toast and resume
                    return $.publish( 'toast', [2, errorMessage] );
                  }

                  // show error dialog
                  var errorDialog = AlertModal({
                    title: capitalize( 'operation failed' ),
                    message: errorMessage,
                    cancel: b2,
                    confirmVisible: false,
                    cancelVisible: true
                  });

                  // listen for custom events
                  errorDialog.on( 'visible', _ctx.togglePopup,  _ctx );
                  errorDialog.on( 'hidden', _ctx.togglePopup, _ctx );

                  // hide loading dialog
                  this.hide(function(){

                    // insert dialog in 'generic-modal' placeholder
                    _ctx.setView( '.generic-modal', errorDialog );

                    // render alert modal
                    errorDialog.render();
                  });
                });
            });

            // insert dialog in 'generic-modal' placeholder
            _ctx.setView( '.generic-modal', downloadModal );

            // update popup type
            _ctx.setState( 'popupType', false );

            // render modal
            downloadModal.render();
          }
        })
        .catch((err) => {

          // progress = false
          this.inProgress = false;

          // get error type
          var errType    = getProp( err, ['type'], 1 );
          var errMessage = getProp( err, ['message'], 'Login Error!' );

          // check error type
          if ( errType == 4 ) {

            // toast and resume
            return $.publish( 'toast', [2, errMessage] );
          }

          // session expired
          $.publish('session-expired', () => {

            // call on toggle connection again
            this.onToggleConnection( null, isOnline );
          });
        });
    }

    // request data to use in offline mode for a single layout
    requestData(sessionKey, layout) {

      // returns a promise
      return new Promise((resolve, reject) => {

        /*// development only
        if ( true && layout.requestKey == 'ASData_PGEntry' ) {
          reject({
            type: 10,
            message: 'Custom SmartPigs development only error!'
          });
        }*/

        // init server address
        var server_address = session.get( 'device', Const.SERVER_URL ) || '/';

        // ajax request
        $.ajax({
          type: 'POST',
          url: server_address + 'get.html?' + sessionKey + '?' + layout.offLineKey,
          data: JSON.stringify( layout ),
          crossdomain: true
        }).done((response) => {
          var data;
          try {
            data = JSON.parse( response );
          } catch ( e ) {

            // make sure to silently skip functionality when error
            return reject({
              type: 7,
              source: 'Server',
              message: response
            });
          }

          resolve( data );
        }).fail(() => {

          // call ajax fail
          var connectionType = utils.ajaxFail.apply( null, arguments );

          // reject promise
          reject({
            type: 5,
            connectionType: connectionType,
            message: 'No connection!'
          });
        });
      });
    }

    // save data into data store
    saveToStore(layout, response) {
      var rows,
        isCard = false;

      // get table names
      var dbTables = Const.DB_TABLES;

      // define default store name
      var storeName = dbTables[0].name;

      // define 'card' regular expression to match *card requests
      var cardRegEx = /card/i;

      // check if card data
      if ( cardRegEx.test(layout.requestKey) ) {

        // update flag
        isCard = true;

        // get rows
        rows = getProp( response, ['sowcards'], [] );

        // extra check
        if ( !rows.length ) {

          // resolve promise and resume
          return 0;
        }

        // normalize sowcards
        map(rows, function(sowcard){

          // update sowcard layout
          sowcard.layout = layout.requestKey;

          // update sowcard number
          if ( sowcard && sowcard.hasOwnProperty('number') ) {

            // transform number to lower case
            sowcard.number = sowcard.number.toLowerCase();
          }
        });

        // get actual name
        storeName = layout.requestKey.toLowerCase().indexOf('sowcard') > -1 ? dbTables[1].name : dbTables[2].name;
      } else {

        // get animals
        rows = getProp(response, ['animals', 'tr'], getProp(response, ['tr'], []));

        // normalize rows
        // rows = map( rows, TableView.prototype.normalizeRow );

        // normalize rows
        rows = map( rows, function(row){

          // add layout key
          row.layout = layout.requestKey;

          // resume
          return TableView.prototype.normalizeRow(row);
        });

        // reduce row arrays and map it in the same time
        rows = filter(rows, function(tRow) {

          // check if row has data and therefore has any id on it
          if ( !tRow.hasOwnProperty('data') || !tRow.data.length ) return false;

          // resume
          return true;
        });

        // check rows again object
        if ( !rows.length ) {

          // resolve promise and resume
          return 0;
        }
      }

      // get db connection
      return this
        .getConnection()
        .then((connection) => {

          // use db connection
          return connection.updateRows( storeName, rows );
        })
        .then(() => {

          // isCard
          if ( isCard ) {

            // save card
            session.set( 'card', layout.requestKey, 'maxIndex', rows.length );
          }

          // resolve promise
          return rows.length;
        });
    }

    onLanguageChange(ev, lang) {

      // update top view lang
      this.setState( 'lang', lang );

      // loop through each view in this top view
      for( var vName in this.views ) {

        // current view
        this.views[ vName ].trigger( 'language-change', lang );
      }
    }

    onReset() {

      // get db connection
      this
        .getConnection()
        .then((connection) => {

          // use db connection
          return connection.delete();
        })
        .then(() => {
          var currentDialog;

          // reset local storage
          session.reset();

          // check popup state
          if ( this.getState('popup') ) {

            // get current modal
            currentDialog = this.getView( '.generic-modal' );

            // check current dialog
            if ( !currentDialog ) {

              // toast and resume
              return $.publish( 'toast', [2, 'popup active but no current dialog instance!'] );
            }

            // toggle settings modal
            currentDialog.hide(() => global.location.reload());

            // resolve promise
            return;
          }

          // reload
          global.location.reload();
        })
        .catch((err) => {

          // get error message
          var errMsg = err.message || err.toString();

          // toast
          $.publish( 'toast', [2, 'Database could not be destroyed! Error: ' + errMsg] );
        });
    }

    onConnectionChanged(ev, connectionState) {

      // update connection state
      session.set( 'app', 'connection', connectionState ).persist();

      // trigger offline mode
      menuModule.updateModel({ connection: connectionState });
    }

    onToggleLogging(ev, toggle, moduleName) {

      // toggle module logging
      debug[toggle ? 'enable' : 'disable']( moduleName );
    }

    onSessionExpired(ev, callback) {

      // create login modal
      var currentDialog = LoginModal({ lang: this.getState('lang'), route: 'relogin.html' });

      // listen for custom events
      currentDialog.on( 'visible', this.togglePopup, this );
      currentDialog.on( 'hidden', this.togglePopup, this );
      currentDialog.on( 'login-success', callback);

      // insert dialog in 'generic-modal' placeholder
      this.setView( '.generic-modal', currentDialog );

      // render session modal and resume
      currentDialog.render();
    }

    // on logout handler
    onLogout() {

      // check connection state
      if ( session.get('app', 'connection') > Const.NET_CONNECTED ) {

        // progress = true
        this.inProgress = true;

        // attempt to login
        var loginApi = LoginController( session );

        // on login success callback
        return loginApi
          .checkStatus(session)
          .then((result) => {

            // update app connection state
            session.set( 'app', 'connection', Const.NET_CONNECTED ).persist();

            // log
            log( result );

            // sync
            this.sync( this.onLogout.bind(this) );

            // resolve promise
            return true;
          })
          .catch((err) => {

            // progress = false
            this.inProgress = false;

            // check error type
            if ( getProp(err, ['type'], 1) == 1 ) {

              // session expired
              return $.publish('session-expired', () => {

                // repeat sync
                this.sync( this.onLogout.bind(this) );
              });
            }
            var errMessage = getProp( err, ['message'], 'Unknown error @onLogout!' );

            // toast
            $.publish( 'toast', [2, errMessage] );
          });
      }

      // show spinner
      $.publish( 'spinner', [true] );

      // async operation
      var logout = new Promise((resolve, reject) => {

        // init server address
        var server_address = session.get( 'device', Const.SERVER_URL ) || '/';

        // logout request
        $.ajax({
          type: 'POST',
          url: server_address + 'logout.html' + session.get( 'layouts', 'sessionKey' ),
          crossdomain: true
        }).done(resolve).fail(() => {

          // call ajax fail
          var connectionType = utils.ajaxFail.apply( null, arguments );

          // reject promise
          reject({
            type: 5,
            connectionType: connectionType,
            message: 'No connection!'
          });
        });
      });

      // returns a promise
      return logout
        .then(() => {

          // return a promise
          return this.clearTables();
        })
        .then(() => {

          // reset layouts
          session.reset( 'layouts' );

          // reset language
          session.reset( 'sp_lang' );

          // persist session
          session.persist();

          // navigate
          Backbone.history.navigate( 'index', { trigger: true } );

          // resolve promise
          return true;
        })
        .catch((err) => {

          // check error type
          if ( getProp(err, ['type']) == 5 ) {
            var errMessage = getProp( err, ['message'], 'Unknown error @onLogout!' );

            // toast
            $.publish( 'toast', [2, errMessage] );
          }

          // hide spinner
          $.publish( 'spinner', [false] );

          // log
          console.log( err );
        });
    }

    clearTables() {

      // get db connection
      return this
        .getConnection()
        .then((connection) => {

          // create tables array
          var tables = map(Const.DB_TABLES, function(t) {
            return t.name;
          });

          // use db connection
          return connection.clearTables(tables);
        });
    }

    onSettings() {

      // get current page name
      var pageName = this.getState( 'pageName' );

      // on android
      if ( pageName == 'index' && android ) {

        // navigate
        Backbone.history.navigate( 'settings', { trigger: true } );

        // resume
        return;
      }

      // get settings model
      var settingsModal = SettingsModal( this.getState('lang') );

      // attach events
      settingsModal.on( 'visible', this.togglePopup.bind(this) );
      settingsModal.on( 'hidden', this.togglePopup.bind(this) );

      // set view
      this.setView( '.generic-modal', settingsModal );

      // render settings modal
      settingsModal.render();
    }

    onBluetooth() {

      // get top view
      var tView = this.getView( '#page-content' );

      // validate top view
      if ( !tView ) {

        // toast and resume
        return $.publish( 'toast', [2, 'Could not get view @TopView->onBluetooth!'] );
      }

      // trigger generic back event
      tView.trigger( 'bluetooth' );
    }

    // logout handler
    logoutHandler() {

      // check popup state
      if ( this.getState('popup') ) {

        // hide active dialog
        return this.hideDialog();
      }

      // show logout modal
      var logoutDialog = LogoutModalView( this.getState('lang') );

      // listen for custom events
      logoutDialog.on( 'visible', this.togglePopup, this );
      logoutDialog.on( 'hidden', this.togglePopup, this );
      logoutDialog.on( 'logout', this.onDialogLogout, this );

      // insert dialog in 'generic-modal' placeholder
      this.setView( '.generic-modal', logoutDialog );

      // render dialog view
      logoutDialog.render();
    }

    sync(callback) {
      var reqLength,
        requestQueue = [];

      // save context refference
      var _ctx = this;

      // progress = true
      this.inProgress = true;

      // get old layouts
      var layouts = session.get( 'layouts' );

      // define sides
      var sides = ['left', 'center', 'right'];

      // map through each side
      // check how many stores need to be synched
      map(sides, function(side){

        // map through each item
        map(layouts[side].items, function(item){

          // check if item should be synced
          if ( session.get('dirty', item.requestKey) ) {

            // update request queue
            requestQueue.push( item );
          }
        });
      });

      // get request queue length
      reqLength = requestQueue.length;

      // resume early
      if ( !reqLength ) {

        // check callback
        if ( isFunction(callback) ) {
          callback.call( this );
        }

        // progress = false
        this.inProgress = false;

        // resume
        return;
      }

      // get syncModal
      var syncModal = SyncModalView( this.getState('lang') );

      // attach custom events
      syncModal.on('hidden', this.togglePopup, this);
      syncModal.on('visible', this.togglePopup, this);
      syncModal.on('visible', () => {

        // progress = true
        this.inProgress = true;

        // loop through each layout in the request queue
        var requests = map(requestQueue, (layout, idx) => {
          var reqIdx = reqLength - idx - 1;

          return this
            .getDirtyStore(layout.requestKey)
            .then((result) => {

              // toast
              $.publish( 'toast', [0, 'Synchronyze data: ' + layout.requestKey] );

              // returns a promise
              return _ctx.syncDirtyData( result, layout );
            })
            .then(() => {

              // get db tables
              var dbTables = Const.DB_TABLES;

              // define store name
              var storeName = dbTables[0].name;

              // create '*card' regex
              var cardRegex = /card/i;

              // check request key
              if ( cardRegex.test(layout.requestKey) ) {

                // update storea name
                storeName = layout.requestKey.toLowerCase().indexOf('sowcard') > -1 ? dbTables[1].name : dbTables[2].name;
              }

              // get db connection
              return this
                .getConnection()
                .then((connection) => {

                  // use db connection
                  return connection.clearStoreBy( storeName, {layout: layout.requestKey} );
                })
                .then(() => {

                  // last store
                  if ( !reqIdx ) {

                    // progress = false
                    this.inProgress = false;

                    // done sync
                    this.doneSync( callback );
                  }

                  // resolve promise
                  return true;
                });
            });
        });

        // loop through each request
        var syncOperation = Promise.each(requests, function(data, idx){

          // log
          console.log( idx + '. success: ', data );
        });

        // catch any error
        syncOperation.catch((err) => {

          // progress = false
          this.inProgress = false;

          // hide sync dialog
          syncModal.hide(function(){

            // get error message
            var errMessage = getProp( err, ['message'], 'Unknown error @sync!' );

            // toast
            $.publish( 'toast', [2, errMessage] );
          });
        });
      });

      // insert dialog in 'generic-modal' placeholder
      this.setView( '.generic-modal', syncModal );

      // update popup type meaning that
      // this dialog cannot be cancelled
      this.setState( 'popupType', false );

      // render modal
      syncModal.render();
    }

    // get dirty data based on provided layout
    getDirtyStore(requestKey) {

      // get table names
      var dbTables = Const.DB_TABLES;

      // define default store name
      var storeName = dbTables[0].name;

      // define 'card' regular expression to match *card requests
      var cardRegEx = /card/i;

      // check if card data
      if ( cardRegEx.test(requestKey) ) {

        // get actual name
        storeName = requestKey.toLowerCase().indexOf('sowcard') > -1 ? dbTables[1].name : dbTables[2].name;
      }

      // get db connection
      return this
        .getConnection()
        .then((connection) => {

          // build query options
          var q = { isDirty: 1 };

          // check store name
          if ( storeName == 'layout' ) {

            // update query options
            q.layout = requestKey;
          }

          // use db connection
          return connection.getRowsBy( storeName, q );
        });
    }

    // sync dirty store helper
    syncDirtyData(data, layout) {
      var i,
        src = 'tr';

      // create empty data wrapper
      var toSend = { layout: layout };

      // log
      log( data );

      // result simple validation
      if ( data == 'notfound' || !data.length ) {

        // if dirty
        if ( session.get('dirty', layout.requestKey) ) {

          // reset dirty
          session.set( 'dirty', layout.requestKey, 0 );
        }

        // resume
        return true;
      }

      // fix sowcard data
      if ( data[0].hasOwnProperty( 'age' ) || data[0].hasOwnProperty( 'breed' ) || data[0].hasOwnProperty( 'number' ) ) {

        // update source
        src = 'sowcards';

        // update data wrapper
        toSend[ src ] = [];

        // build sowcards data
        for ( i=0; i<data.length; i++ ) {
          toSend[ src ].push( data[i] );
        }
      } else {

        // update data wrapper
        toSend[ src ] = [];

        // loop trough result to check for new rows
        for ( i=0; i<data.length; i++ ) {

          // if newId not a number
          if ( isNaN( data[i].id ) ) {

            // means items[i] is a new row -> reset id
            data[i].id = 'a';
          }

          // add data to table row
          toSend[ src ].push({ data: data[i].data });
        }
      }

      // if any sowcard to send
      if ( !toSend[ src ].length ) {

        // toast
        $.publish( 'toast', [3, 'Sync error: ' + 'no data to synchronize for ' + layout.requestKey + ' @syncDirtyData!'] );

        // nothing to synchronize
        throw {
          type: 6,
          source: 'SmartPigs',
          message: 'No data to synchronize for ' + layout.requestKey + ' @syncDirtyData!'
        };
      }

      // returns a promise
      return new Promise((resolve, reject) => {

        // init server address
        var server_address = session.get( 'device', Const.SERVER_URL ) || '/';

        $.ajax({
          type: 'POST',
          url: server_address + 'send.html?' + session.get( 'layouts', 'sessionKey' ) + '?' + layout.requestKey,
          data: JSON.stringify( toSend ),
          crossdomain: true
        }).done((response) => {

          // error received on sync
          if ( typeof response == 'string' && response[0] == '!' ) {

            // save response
            errorQueue.push( response );
          }

          // resolve anyway
          resolve( response );
        }).fail(() => {

          // call ajax fail
          var connectionType = utils.ajaxFail.apply( null, arguments );

          // reject promise
          reject({
            type: 5,
            connectionType: connectionType,
            message: 'No connection!'
          });
        });
      });
    }

    // done sync callback
    doneSync(lastCallback) {
      var i,
        finalErrorMessage = '';

      // if any error in the error queue
      if ( errorQueue.length ) {
        for ( i=0; i<errorQueue.length; i++ ) {

          // update final error message
          finalErrorMessage += errorQueue[i].slice( 1 ) + '<br />';
        }

        // reset errorQueue
        errorQueue.length = 0;
        errorQueue = [];
      }

      // get active dialog
      var activeDialog = this.getView( '.generic-modal' );

      // check view
      if ( !activeDialog ) {

        // toast and resume
        return $.publish( 'toast', [2, 'popup active but no current dialog instance!'] );
      }

      // hide syncModal
      activeDialog.hide(() => {
        var currentDialog,
          lang = this.getState( 'lang' );

        // labels
        var b1 = session.get( 'sp_lang', 'SP_Toast15') || Language.toast[15][lang];
        var b2 = session.get( 'sp_lang', 'SP_ModalsTitle5') || Language.modals.title5[lang];
        var b3 = session.get( 'sp_lang', 'SP_ButtonCancel') || Language.button.cancel[lang];

        if ( !finalErrorMessage ) {

          // toast
          $.publish( 'toast', [1, b1] );

          // check callback
          if ( isFunction(lastCallback) ) {

            // callback
            lastCallback();
          }

          // resume
          return;
        }

        // show error dialog
        currentDialog = AlertModal({
          title: 'Sync ' + b2 + '!',
          message: finalErrorMessage,
          cancel: b3,
          confirmVisible: false,
          cancelVisible: true
        });

        // listen for custom events
        currentDialog.on( 'visible', this.togglePopup,  this );
        currentDialog.on( 'hidden', this.togglePopup, this );

        // insert dialog in 'generic-modal' placeholder
        this.setView( '.generic-modal', currentDialog );

        // render alert modal
        currentDialog.render();
      });
    }

    hideDialog(callback) {

      // get active dialog
      var activeDialog = this.getView( '.generic-modal' );

      // check active dialog
      if ( !activeDialog ) {

        // toast and resume
        return $.publish( 'toast', [2, 'popup active but no current dialog instance!'] );
      }

      // hide dialog and logout
      activeDialog.hide( callback );
    }

    onDialogLogout() {

      // hide dialog
      return this.hideDialog( this.onLogout.bind(this) );
    }

    updateMenu(type, lang) {
      var menubar = this.getView( 'nav' );

      // check view
      if ( !menubar ) {

        // get menubar
        menubar = menuModule.getView();

        // create menubar
        this.setView( 'nav', menubar );
      }

      // update menubar
      menubar.update( type, lang );
    }

    togglePopup() {

      // current popup state
      var popup = this.getState( 'popup' );

      // update popup flag
      this.setState( 'popup', !popup );

      // get current view
      var cView = this.getView( '#page-content' );

      // trigger popup state on current view (back to subcomponents)
      cView.trigger( 'popup', !popup );

      // reset popup type
      this.setState( 'popupType', true );
    }

    // using actual jQuery fadeOut method
    fadeOut(duration) {

      // get partial element
      var $element = this.$( '#page-content' );

      // cache element
      if ( this.getState('full') ) {

        // get element
        $element = this.$el;
      }

      return new Promise((resolve, reject) => {

        // hide element
        $element
          .hide(duration || this.getState('fadeOutMs') || 10)
          .promise()
          .done(() => {

            // unsubscribe all events
            this.unsubscribe();

            // resolve promise
            resolve();
          })
          .fail(reject);
      });
    }

    fadeIn(duration) {
      var $view = this.$el;

      var full     = this.getState( 'full' );
      var fadeInMs = this.getState( 'fadeInMs' );

      // check full render
      if ( full ) {

        // toggle full rendering
        this.setState( 'full', !full );
      } else {

        // update view
        $view = this.$( '#page-content' );
      }

      return new Promise(function(resolve){
        $view.fadeIn( duration || fadeInMs, resolve );
      });
    }

    renderView(options) {
      var full = this.getState( 'full' );
      var view = full ? this : options.activeView;

      // remove generic-modal view when transitioning to a different page
      this.removeView( '#generic-modal' );

      // update page name
      this.setState( 'pageName', options.page );

      // update top class
      this.$el.removeClass().addClass( options.page );

      // update menubar
      this.updateMenu( options.type, this.getState('lang') );

      // update active view
      this.setView( '#page-content', options.activeView );

      return new Promise((resolve) => {
        view
          .render()
          .promise()
          .done(() => {

            // check callback
            if ( isFunction(options.onSuccess) ) {
              options.onSuccess();
            }

            resolve();
          });
      });
    }

    orientationChanged() {

      // get main view
      var mainView = this.getView( '#page-content' );

      // validate main view
      if ( !mainView ) return;

      // else trigger orientation change
      mainView.trigger( 'orientation-changed' );
    }

    subscribe(event, callback) {

      // validate arguments
      if ( !event || !isString(event) || this.evs[event] || !isFunction(callback) ) return;

      // update events object
      this.evs[ event ] = callback;

      // subscribe for event
      $.subscribe( event, this.evs[event] );
    }

    unsubscribe(event) {
      if ( !event ) {
        for( var ev in this.evs ) {

          // unsubscribe each event
          $.unsubscribe( ev );
        }

        // clear evs
        this.evs = {};

        // resume
        return;
      }

      // validate argument
      if ( isString(event) && event && this.evs.hasOwnProperty(event) ) {

        // unsubscribe single event
        $.unsubscribe( event );

        // update single event callback
        this.evs[ event ] = null;

        // resume
        return;
      }

      // add support for unsubscribing an array ov events
    }

    setState(key, value) {
      if ( !isPlainObject(this.appState) ) return;
      this.appState[ key ] = value;
      return value;
    }

    getState(key) {
      return getProp( this.appState, key );
    }

    cleanup() {

      // stop listening for custom events
      $.unsubscribe( 'android-back' );
    }
  };
};
