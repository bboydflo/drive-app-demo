'use strict';

// libs
import getProp from 'get-prop';

// lodash helpers
import { assign, isString, isFunction, isPlainObject } from 'lodash';

// top view factory
export default ( $, debug, Backbone, Layout, env, utils, session, template,
  MenubarModule, MenubarModel, SessionModalView, MenubarView ) => {

  // local module vars
  var menuModule;

  // return top view instance
  return class V extends Layout {

    constructor(o) {
      super(assign({
        // define wrapper element
        el: '#page-container',

        // define template
        // template: Templates.hbs['top-view'],
        template: template,

        // custom events object
        evs: {},

        // app state
        appState: {

          // render full top view
          full: true,

          // popup state
          popup: false,

          // page loaded
          loaded: true,

          // current page name
          pageName: 'index',

          // fade in/out duration
          fadeInMs: 0,
          fadeOutMs: 0,

          // dialog type. true -> can be manually hidden, false -> cannot be manually hidden
          popupType: true
        }
      }, o));
    }

    initialize(appState) {

      // init app state
      assign(this, {appState: appState});

      // subscribe for spinner events
      $.subscribe( 'spinner', this.onSpinner.bind(this) );

      // subscribe for 'menu-back' events
      $.subscribe( 'menu-back', this.onBack.bind(this) );

      // listen for 'logout' events
      $.subscribe( 'logout', this.onLogout.bind(this) );

      // listen for 'show-login-dialog' events
      $.subscribe( 'show-login-dialog', this.showLoginDialog.bind(this) );

      // listen for 'language-change' events
      $.subscribe( 'language-change', this.languageChange.bind(this) );

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

    // on logout handler
    onLogout() {

      // show spinner
      $.publish( 'spinner', [true] );

      // async operation
      var logout = new Promise((resolve, reject) => {
        $.ajax({
          type: 'POST',
          url: 'logout.html' + session.get( 'layouts', 'sessionKey' )
        }).done(resolve).fail(() =>{

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
        .then(() =>{

          // reset layouts
          session.reset( 'layouts' ).persist();

          // navigate to 'index'
          Backbone.history.navigate( 'index', { trigger: true } );

          // resolve promise
          return true;
        }).catch((err) =>{

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

    showLoginDialog(ev, options) {

      // create login modal
      var currentDialog = SessionModalView({
        lang: this.getState('lang'),
        route: 'relogin.html'
      });

      // listen for custom events
      currentDialog.on( 'visible', this.togglePopup, this );
      currentDialog.on( 'hidden', this.togglePopup, this );
      currentDialog.on( 'login-success', function(){

        // publish event
        $.publish( 'login-success', [options] );
      });

      // insert dialog in 'generic-modal' placeholder
      this.setView( '.generic-modal', currentDialog );

      // render session modal and resume
      currentDialog.render();
    }

    onBack() {
      var topView;

      // check if popup active
      if ( this.getState('popup') ) {

        // check popup type
        if ( this.getState('popupType') ) {

          // hide active dialog
          this.hideDialog();
        }

        return;
      }

      topView = this.getView( '#page-content' );

      // check top view
      if ( !topView ) {
        return $.publish( 'toast', [2, 'Could not get view @TopView->onBack!'] );
      }

      // trigger generic back event
      topView.trigger( 'back' );
    }

    languageChange(ev, lang) {

      // update top view locale state
      this.setState( 'lang', lang );

      // loop through each view in this top view
      for( var vName in this.views ) {

        // current view
        this.views[ vName ].trigger( 'language-change', lang );
      }
    }

    hideDialog(callback) {

      // get active dialog
      var activeDialog = this.getView( '.generic-modal' );

      // check active dialog
      if ( !activeDialog ) {

        // toast and resume
        return $.publish( 'toast', [2, 'popup active but no current dialog instance!'] );
      }

      // toggle active dialog
      // activeDialog.toggle();
      // hide dialog and logout
      activeDialog.hide( callback );
    }

    updateMenu(type, locale) {
      var menubar = this.getView( 'nav' );

      // check view
      if ( !menubar ) {

        // get menubar
        menubar = menuModule.getView();

        // create menubar
        this.setView( 'nav', menubar );
      }

      // update menubar
      menubar.update( type, locale );
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
      var $element,
        _self = this;

      // cache element
      if ( this.getState('full') ) {

        // get element
        $element = this.$el;
      } else {

        // get partial element
        $element = this.$( '#page-content' );
      }

      return new Promise(function(resolve, reject){

        // hide element
        $element
          .hide( duration || _self.getState('fadeOutMs') || 10 )
          .promise()
          .done(function(){

            // unsubscribe all events
            _self.unsubscribe();

            // resolve promise
            resolve();
          })
          .fail(function( err ){

            // log
            console.log( err );

            // reject error
            reject( err );
          });
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

      return new Promise(function(resolve){
        view
          .render()
          .promise()
          .done(function(){

            // check callback
            if ( isFunction(options.onSuccess) ) {
              options.onSuccess();
            }

            resolve();
          });
      });
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

        return;
      }

      // validate argument
      if ( isString(event) && event && this.evs.hasOwnProperty(event) ) {

        // unsubscribe single event
        $.unsubscribe( event );

        // update single event callback
        this.evs[ event ] = null;

        return;
      }

      // add support for unsubscribing an array ov events
    }

    setState(key, value) {
      if ( !isPlainObject(this.appState) ) return;
      this.appState[ key ] = value;
      return value;
    }

    getState( key ) {
      return getProp( this.appState, key );
    }
  };
};
