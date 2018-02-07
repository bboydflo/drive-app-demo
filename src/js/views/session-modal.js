'use strict';

// libs
import getProp from 'get-prop';

// lodash functions
import { extend, capitalize } from 'lodash';

// module vars
var lang;

// exports
export default ($, Language, DialogModel, LoginModel, LoginFormView, DialogView, LoginController, session) => {

  // return session modal view
  return (opt) => {

    // on session expired helper
    var onSessionExpired = () => {

      // local vars
      var error, field, credentials,
        _self    = this,
        formView = this.getView( '.body-component' );

      // check form view
      if ( !formView ) return;

      // get credentials
      credentials = formView.getData();

      // save bad credentials anyway
      session.set( 'cache', 'credentials', credentials );

      // labels
      var t0 = session.get( 'sp_lang', 'SP_IndexErrorMsg6') || Language.index.errorMsg6[lang];
      var t1 = session.get( 'sp_lang', 'SP_IndexErrorMsg3') || Language.index.errorMsg3[lang];
      var t2 = session.get( 'sp_lang', 'SP_IndexErrorMsg1') || Language.index.errorMsg1[lang];

      // loop through each key
      for ( field in credentials ) {

        // check field
        if ( field == 'updateValue' ) continue;

        // extra check
        if ( !credentials.hasOwnProperty(field) || !credentials[field] ) {

          // define error
          error = {
            visible: true,
            title: 'SmartPigs ' + capitalize( t0 ) + ': ',
            message: t1
          };

          // dialog update model with error will trigger rerender
          // resume
          return this.model.set( 'error', error );
        }
      }

      // update error
      error = {
        visible: false,
        title: '',
        message: ''
      };

      // dialog update model with error
      this.model.set( 'error', error );

      // manually rerender
      this.updateError();

      // get login api
      var loginApi = LoginController( session );

      // on login success callback
      loginApi
        .reLogin(session, credentials)
        .then(function(){

          // toggle modal
          _self.hide(function(){

            // trigger 'login-success' event
            _self.trigger( 'login-success' );
          });
        })
        .catch(function(err){

          // get error type
          var errType = getProp( err, ['type'], 1 );

          // get error message
          var errMessage = getProp( err, ['message'], t2 );

          // relogin error
          console.warn( 'relogin error: ' + errMessage + ', credentials: ' + JSON.stringify(credentials) );

          // not 'loginFailed'
          if ( errType == 1 ) {

            // update message
            errMessage = t2;
          }

          // define error
          error = {
            visible: true,
            title: 'Server ' + capitalize( t0 ) + ': ',
            message: errMessage
          };

          // trigger error and resume
          _self.trigger( 'error', error );
        });
    };

    // get current app language
    lang = opt.lang || session.get( 'settings', 'lang' );

    // get credentials
    var credentials = session.get( 'cache', 'credentials' );

    // labels
    var t0 = session.get( 'sp_lang', 'SP_IndexDatabase') || Language.index.database[lang];
    var t1 = session.get( 'sp_lang', 'SP_IndexPassword') || Language.index.password[lang];
    var t2 = session.get( 'sp_lang', 'SP_IndexUser') || Language.index.user[lang];
    var t3 = session.get( 'sp_lang', 'SP_ModalsTitle1') || Language.modals.title1[lang];
    var t4 = session.get( 'sp_lang', 'SP_ButtonCancel') || Language.button.cancel[lang];
    var t5 = session.get( 'sp_lang', 'SP_ButtonOk') || Language.button.ok[lang];

    // define login form placeholders
    var placeholders = {
      placeholderDb: t0,
      placeholderPass: t1,
      placeholderUser: t2
    };

    // extend credentials with placeholders
    extend( credentials, placeholders );

    // create login model
    var loginModel = new LoginModel( credentials );

    // create new login view
    var loginForm = new LoginFormView({ model: loginModel, lang: lang });

    // define dialog model
    var model = new DialogModel({
      id: 'sessionModal',
      icon: 'glyphicon-time',
      title: t3,
      visible: false,
      destroy: true,
      options: {
        backdrop: 'static',
        keyboard: true,
        show: false,
        xModal: true
      },
      buttons: [{
        class: 'btn-default',
        title: t4,
        visible: true,
        event: 'cancel'
      }, {
        class: 'btn-primary',
        // title: Language.button.login[lang],
        title: t5,
        icon: 'glyphicon-log-in',
        visible: true,
        event: 'session-expired'
      }]
    });

    // define dialog view
    var view = new DialogView({ model: model });

    // listen for 'session-expired' event
    view.on( 'session-expired', onSessionExpired.bind(view, opt) );

    // listen for 'error' event
    view.on('error', function(error){

      // dialog update model with error
      this.model.set( 'error', error );

      // manually rerender
      this.updateError();
    });

    // append paragraph view inside dialog view
    view.setView( '.body-component', loginForm );

    // return view
    return view;
  };
};
