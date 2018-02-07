'use strict';

// libs
import getProp from 'get-prop';

// lodash functions
import { map, assign, isArray, capitalize } from 'lodash';

// exports
export default ($, Backbone, Layout, ErrorModel, LoginModel, LoginForm, ErrorView,
  Const, template, Language, LoginController, locale, utils, session, DbConnection ) => {

  // resume
  return class V extends Layout {

    constructor(o) {
      super(assign({

        // set view wrapper to false
        el: false,

        // define template function
        template: template,

        // has dialog active
        popup: false,

        // define events hash
        events: {
          'click #clearForm': 'clearEvent',
          'click #loginForm': 'loginEvent'
        }
      }, o));
    }

    initialize() {

      // listen for custom events
      this.on( 'error', this.updateError );
      this.on( 'back', this.onBack.bind(this) );
      this.on( 'language-change', this.languageChange.bind(this) );
    }

    beforeRender() {
      var loginModel,
        credentials = session.get( 'cache', 'credentials' ) || {};

      /**
       * TODO
       *
       * => check credentials
       */

      // labels
      var v1 = session.get( 'sp_lang', 'SP_IndexDatabase') || Language.index.database[this.lang];
      var v2 = session.get( 'sp_lang', 'SP_IndexUser') || Language.index.user[this.lang];
      var v3 = session.get( 'sp_lang', 'SP_IndexPassword') || Language.index.password[this.lang];

      // define login form placeholders
      var placeholders = {
        placeholderDb: v1,
        placeholderPass: v3,
        placeholderUser: v2
      };

      // extend credentials with placeholders
      assign( credentials, placeholders );

      // get login view
      var loginView = this.getView( '.login-component' );

      // check login view
      if ( !loginView ) {

        // create login model
        loginModel = new LoginModel( credentials );

        // create new login view
        loginView = new LoginForm({ model: loginModel, lang: this.lang });

        // setup handlers
        loginView.on( 'login', this.loginEvent.bind(this) );

        // set login view
        this.setView( '.login-component', loginView );
      } else {

        // update language
        loginView.lang = this.lang;

        // update login view model
        loginView.model.set( credentials );
      }

      // error component
      if ( !this.getView('.error-component') ) {

        // create error model
        var errorModel = new ErrorModel();

        // set card view. error view factory will return an ErrorView instance
        this.setView( '.error-component', new ErrorView({model: errorModel}) );
      }
    }

    afterRender() {

      // attempt to fix auto-fill
      if (navigator.userAgent.toLowerCase().indexOf('chrome') >= 0) {

        // fix auto-fill
        $('input:-webkit-autofill').each(function(){
          var text = $(this).val();
          var name = $(this).attr('name');
          $(this).after(this.outerHTML).remove();
          $('input[name=' + name + ']').val(text);
        });
      }

      // init android
      $.publish( 'init-android' );
    }

    serialize(){

      // labels
      var v5 = session.get( 'sp_lang', 'SP_ButtonClear') || Language.button.clear[this.lang];
      var v6 = session.get( 'sp_lang', 'SP_ButtonLogin') || Language.button.login[this.lang];

      // template data
      return { clear: v5, login: v6 };
    }

    // get connection
    getConnection() {

      // get connection
      return DbConnection
        .then(function(connection) {

          // resolve promise
          return connection;
        });
    }

    // 'language-change' helper
    languageChange( lang ) {

      // update language
      this.lang = lang;

      // refresh login view
      this.render();
    }

    onBack() {

      // check popup state
      if ( !this.popup ) {

        // toast and resume
        return $.publish( 'toast', [2, 'Exit SmartPigs manually!'] );
      }
    }

    // need to implement this common function for the top views
    isDirty() {

      // resume
      return false;
    }

    clearEvent(ev) {

      // prevent default
      ev.preventDefault();

      /*// development
      if ( true && Modernizr.smartpigs ) {

        // toggle native keyboard
        Android.toggleCustomKeyboard();

        // resume
        return;
      }*/

      // local vars
      var formView = this.getView( '.login-component' );

      // check form view
      if ( !formView ) return;

      // trigger event on form view and resume
      return formView.trigger( 'clear' );
    }

    loginEvent(ev) {
      var error, field, formView, credentials, loginApi,
        _self = this;

      // prevent default
      ev.preventDefault();

      // get form view
      formView = this.getView( '.login-component' );

      // check form view
      if ( !formView ) return;

      // get credentials
      credentials = formView.getData();

      // update credentials
      credentials.lang = session.get('settings', 'lang') || 'en-us';
      credentials.locale = locale;

      // save bad credentials anyway and persist changes in the local storage
      session.set( 'cache', 'credentials', credentials ).persist();

      // labels
      var v7 = session.get( 'sp_lang', 'SP_IndexErrorMsg3') || Language.index.errorMsg3[this.lang];
      var u1 = session.get( 'sp_lang', 'SP_IndexErrorMsg6') || Language.index.errorMsg6[this.lang];
      var u2 = session.get( 'sp_lang', 'SP_IndexErrorMsg1') || Language.index.errorMsg1[this.lang];

      // loop through each key
      for ( field in credentials ) {

        // extra check
        if ( !credentials.hasOwnProperty(field) || !credentials[field] ) {

          // define error
          error = {
            visible: true,
            title: 'SmartPigs ' + capitalize( u1 ) + ': ',
            message: v7
          };

          // resume
          return this.trigger( 'error', error );
        }
      }

      // update error
      error = {
        visible: false,
        title: '',
        message: ''
      };

      // clear error
      this.trigger( 'error', error );

      // launch spinner
      $.publish( 'spinner', [true] );

      // attempt to login
      loginApi = LoginController( session );

      // define a random string
      var randomString = utils.generateRowId();

      // init server address
      var app_name = session.get( 'device', Const.APP_NAME ) || 'sPigs.apk';
      var app_version = session.get( 'device', Const.APP_VERSION ) || randomString;

      // if app_version
      if ( Modernizr.smartpigs && app_version.length ) {

        // add new attributes to credentials
        credentials.app_name = app_name;
        credentials.app_version = app_version;
      }

      // url old = server_address + 'login.html'
      let url = 'http://localhost:3000/login';

      // login
      loginApi.loginController( url, credentials )
        .then(function(response){
          var dateFormat;

          /*// development
          if ( true ) {

            // throw custom error
            throw new CustomError('some error message', ErrorTypes.NO_CONNECTION, ev);
          }*/

          // publish connection change event
          $.publish( 'connection-change', [Const.NET_CONNECTED] );

          // update layouts icon name
          utils.setLayoutsIconName( response );

          // define sp_lang
          var sp_lang = {};

          // get sp texts
          var texts = getProp( response, ['texts'] ) || '';

          // check texts
          if ( texts ) {

            // parse reponse
            texts = texts.split('","');

            // check langs
            if ( isArray(texts) && texts.length ) {

              // map through langs and create countries
              map(texts, function(val) {

                // no value -> resume
                if ( !val ) return;

                // get lang details
                var wordDetails = val.split( ':' );

                // check language details
                if ( !isArray(wordDetails) || wordDetails.length < 2 ) return;

                // original values. remove commas
                var wordCode = wordDetails[0].replace(/"/g, '');
                var wordText = wordDetails[1].replace(/"/g, '');

                // check language key or language value ar valid
                if ( !wordCode || wordText == ' ' ) return;

                // update countries collection
                sp_lang[wordCode] = wordText;
              });
            }

            // delete texts from response
            delete response.texts;
          }

          // get date format
          // dateFormat = getProp( response, ['dataFormat'] ) || 'dd-mm-yy';
          // update default date format in order to accomodate the new formatting library
          dateFormat = getProp( response, ['dataFormat'] ) || 'dd-MM-yy';

          // strip out ['']
          dateFormat = dateFormat.replace(/'/g, '');

          // save layouts
          session
            .set( 'layouts', response )
            .set('sp_lang', sp_lang)
            // .set( 'settings', 'dateFormat', dateFormat.toUpperCase() )
            .set( 'settings', 'dateFormat', dateFormat )
            .persist();

          // navigate
          Backbone.history.navigate( 'mainmenu', { trigger: true } );

          /* // check if production
          if ( session.get('app', 'production') ) {

            // navigate
            Backbone.history.navigate( 'mainmenu', { trigger: true } );
          } else {

            // development (do restore)
            console.error('remove this lines in production');

            // save a variable in the database
            _self
              .getConnection()
              .then(function(connection) {

                // define a fake row
                var row = {
                  'no': 1234567,
                  'data': [6, '21-01-16', '', 0, '', '10943', '', '', '', 0, 0, '', 0, 0, 1234567, 0],
                  id: 1234567,
                  layout: 'Florin',
                  isDirty: 0,
                  marked: 0,
                  hidden: 0,
                  found: 0,
                  editable: 1,
                  removable: 1,
                  animalno: '10943',
                  tagid: '09650274514',
                  serialno: '02745'
                };

                // insert row
                return connection.updateRow( 'layout', row );
              })
              .catch(function(err) {

                // log
                console.log( err );

                // toast
                $.publish('toast', [0, err.message || err.toString()]);
              })
              .finally(function() {

                // navigate
                Backbone.history.navigate( 'mainmenu', { trigger: true } );
              });
          } */

          // resolve the promise eventually
          return true;
        })
        .catch(function(err){

          // get error type
          var errType    = getProp( err, ['type'], 1 );
          var errMessage = getProp( err, ['message'], u2 );

          // get server_address
          var server_address = session.get( 'device', Const.SERVER_URL ) || '/';

          // publish connection change event
          $.publish( 'toast', [0, 'Error: ' + err.message + ' (server address: ' + server_address + ')', {hideDuration: 20000}] );

          // check error message
          if ( errMessage == 'update' ) {

            // update app
            $.publish( 'update-app', [app_name, app_version] );
          } else {

            // not 'loginFailed'
            if ( errType == 1 ) {

              // update message
              errMessage = Language.index.errorMsg1[ _self.lang ];
            }

            // define error
            error = {
              visible: true,
              title: 'Server ' + capitalize( Language.index.errorMsg6[_self.lang] ) + ': ',
              message: errMessage
            };

            // trigger error and resume
            _self.trigger( 'error', error );
          }

          // hide spinner
          $.publish( 'spinner', [false] );
        });
    }

    updateError( error ) {

      // get error view
      var errorView = this.getView( '.error-component' );

      // check error
      if ( !error ) {

        // update error
        error = {
          visible: false,
          title: '',
          message: ''
        };
      }

      // update error view model
      errorView.model.set( error );
    }
  };
};
