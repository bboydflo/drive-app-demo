'use strict';

// lodash helpers
import { assign } from 'lodash';

// create new router. accepts dependencies
export default ( $, Backbone, session, Const, Language, TopView, IndexController, WhiteboardController ) => {

  // local modules and settings
  var bbHistory = [];

  // return router instance
  return class R extends Backbone.Router {

    constructor(o) {
      super(assign({
        routes: {
          '': 'index',
          'index': 'index',
          'whiteboard': 'whiteboard'
        }
      }, o));
    }

    // happens only once per page refresh
    initialize() {

      // get current lang
      var currentLang = session.get( 'settings', 'locale' ) || session.get( 'settings', 'lang' );

      // setup language
      var lang = Language.name[currentLang] ? currentLang : 'en-us';

      // get last visited page
      var oldPage = session.get( 'cache', 'page' );

      // check location hash
      if ( global.location.hash !== 'index' ) {
        if ( oldPage == 'settings' ) {

          // force user to start on index page
          oldPage = 'index';
        }

        // update location hash
        global.location.hash = oldPage;
      }

      // define app state
      var appState = {
        lang: lang,         // current language
        full: true,         // render full top view
        popup: false,       // popup state
        loaded: true,       // page loaded
        pageName: oldPage,  // cached page name
        fadeInMs: 100,      // fade in duration
        fadeOutMs: 10,      // fade out duration
        popupType: true,    // dialog type. true -> can be manually hidden, false -> cannot be manually hidden
        connection: session.get( 'app', 'connection' )
      };

      // update options
      assign( this, {appState: appState} );

      // create top view instance
      this.topView = new TopView( appState );
    }

    // url gateway
    execute(callback, args, name) {
      var prevPage,
        trigger = false,
        replace = false;

      // define skip flag -> defaults to false
      var skip = false;

      // check route name
      switch ( name ) {
      case 'index':

        // logout middleware
        if ( this.isLoggedIn() ) {

          // remove previous page from bbHistory
          prevPage = bbHistory[bbHistory.length-1];

          // navigate to previous page and resume. update browser history
          this.navigate( prevPage.name || 'whiteboard', { replace: replace } );

          // publish event furhter to the top view
          this.topView.trigger( 'handle-logout' );

          // resume route
          return false;
        }

        // reset bbHistory
        bbHistory = [];
        break;
      case 'whiteboard':

        // login middleware
        if ( !this.isLoggedIn() ) {

          // navigate to 'index' route (updates the URL)
          // { replace : true } doesn't create a new entry in the browser's history
          this.navigate( 'index', {replace: true} );

          // resume route
          return false;
        }

        break;
      case 'notFound':

        // navigate to 'index'
        this.navigate( 'index', { trigger: trigger } );

        // update skip flag
        skip = true;
        break;
      }

      // check skip flag
      if ( skip ) {

        // resume
        return false;
      }

      // update history
      bbHistory.push({
        args : args,
        name : name,
        fragment : Backbone.history.fragment
      });

      // continue
      if ( callback ) {

        // callback
        callback.apply( this, args );
      }
    }

    /**
     * is logged in helper
     * @return {Boolean} [description]
     */
    isLoggedIn() {

      // check session key
      return session.get( 'layouts', 'sessionKey' ) ? true : false;
    }

    /**
     * is logged out helper
     * @return {Boolean} [description]
     */
    isLoggedOut() {

      // check session key
      // return session.get( 'layouts', 'sessionKey' ) ? false : true;
      return !this.isLoggedIn();
    }

    index() {
      IndexController.call(this, ...arguments);
    }
    whiteboard() {
      WhiteboardController.call(this, ...arguments);
    }
  };
};
