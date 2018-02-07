'use strict';

// libs
import getProp from 'get-prop';

// lodash functions
import { assign, capitalize } from 'lodash';

// exports
export default ($, Backbone, Layout, ErrorModel, LoginModel, LoginForm,
  ErrorView, Const, template, Language, LoginController, locale,  utils, session) => {

  // resume
  return class V extends Layout {

    constructor(o) {
      super(assign({

        // set view wrapper to false
        el: false,

        // define template function
        // template: Templates.hbs['whiteboard-login'],
        template,

        // has dialog active
        popup: false,

        // define events hash
        events: {
          'click #loginForm': 'loginEvent'
        }
      }, o));
    }

    initialize() {

      // listen for custom events
      this.on( 'error', this.updateError );
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
        placeholderUser: v2,
        updateTime: Language.index.updateTime[this.lang]
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
    }

    serialize(){

      // labels
      var v6 = session.get( 'sp_lang', 'SP_ButtonLogin') || Language.button.login[this.lang];

      // template data
      return { login: v6 };
    }

    loginEvent( ev ) {
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

        // check field
        if ( field == 'updateValue' ) continue;

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

      // login
      loginApi
        .reLogin(session, credentials)
        .then(function(){

          // navigate
          Backbone.history.navigate( 'whiteboard', { trigger: true } );
        })
        .catch(function(err){

          // get error type
          var errType    = getProp( err, ['type'], 1 );
          var errMessage = getProp( err, ['message'], u2 );

          // get server_address
          var server_address = session.get( 'device', Const.SERVER_URL ) || '/';

          // publish connection change event
          $.publish( 'toast', [0, 'Error: ' + err.message + ' (server address: ' + server_address + ')'] );

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
