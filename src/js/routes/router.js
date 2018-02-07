import _ from 'underscore';
import Const from '../modules/constants';
// import Language from '../modules/lang';

// app router
export default (Backbone, utils, session, IndexController, DemoController,
  SettingsController, MainmenuController, SimpleSpreadController) => {

  // router instance
  return class R extends Backbone.Router {

    constructor (o) {
      super(_.assign({

        // define routes
        routes: {
          '': 'index',
          'demo': 'demo',
          'index': 'index',
          'mainmenu': 'mainmenu',
          'settings': 'settings',
          'database': 'database',
          'p/:requestKey': 'simpleSpread',
          'w/:requestKey': 'getWorkTask',
          'n/:nestedPath': 'nestedRoute',
          'c/:requestKey1(/:no)': 'getCard',
          'wc/:requestKey1/:requestKey2(/:no)': 'getCardByNumber',
          'pdf/:hash': 'getPdf',
          '*notFound': 'notFound'
        }
      }, o));
    }

    // happens only once per page refresh
    initialize () {

      // get last visited page
      let oldPage = session.get('cache', 'page');

      // update location hash
      if (global.location.hash !== 'index') {

        // update old page
        global.location.hash = oldPage === 'settings' ? 'index' : oldPage;
      }

      // Listen for orientation changes
      global.addEventListener('orientationchange', this.orientationChanged.bind(this), false);

      // get app mounting point
      this.$app = document.getElementById('app');
    }

    /**
     * is logged in helper
     * @return {Boolean} [description]
     */
    isLoggedIn () {

      // check session key
      // eslint-disable-next-line
      return session.get('layouts', 'sessionKey') ? true : false;
    }

    /**
     * is logged out helper
     * @return {Boolean} [description]
     */
    isLoggedOut () {

      // check session key
      // return session.get( 'layouts', 'sessionKey' ) ? false : true;
      return !this.isLoggedIn();
    }

    /**
     * should update helper
     * @return {[type]} [description]
     */
    isDirty (topView) {
      let isOffline = session.get('app', 'connection') === Const.NET_OFFLINE;

      // should not update
      if (!topView || isOffline) return false;

      // check if is dirty
      // http://stackoverflow.com/questions/14961891/how-to-check-if-an-object-has-a-function-dojo#14961936
      return topView.isDirty && topView.isDirty();
    }

    onlineMiddleware (apikey) {
      let menuItem = utils.getLayoutBy('requestKey', apikey);

      // offline and no offLineKey available
      if (!menuItem || (session.get('app', 'connection') > Const.NET_CONNECTED && !menuItem.offLineKey)) return false;

      // is online
      return true;
    }

    orientationChanged () {

      // trigger event on top page
      // this.topView.orientationChanged();
      console.log('on orientation change');
    }

    demo () {

      // call controller
      DemoController.call(this);
    }

    index () {

      // call controller
      IndexController.call(this);
    }

    settings () {
      SettingsController.call(this);
    }

    database () {
      // DBViewController.call( this );

      // log
      console.log('render database page');
    }

    mainmenu () {
      MainmenuController.call(this);
    }

    getProgeny () {

      // get args
      // let args = Array.prototype.slice.call(arguments);

      // call progeny controller
      // ProgenyController.apply(this, args);

      // log
      console.log('render progeny page');
    }

    simpleSpread () {
      SimpleSpreadController.call(this, [...arguments]);
    }

    getWorkTask () {

      // get args
      // let args = Array.prototype.slice.call(arguments);

      // call worktask controller
      // WorkTaskController.apply(this, args);

      // log
      console.log('render worktask page');
    }

    getPdf () {

      // get args
      // let args = Array.prototype.slice.call(arguments);

      // call pdf controller
      // PdfController.apply(this, args);

      // log
      console.log('render pdf page');
    }

    getCard () {

      // get args
      // let args = Array.prototype.slice.call(arguments);

      // call card controller
      // CardController.apply(this, args);

      // log
      console.log('render card page');
    }

    getCardByNumber () {

      // get args
      // let args = Array.prototype.slice.call( arguments );

      // call workcard controller
      // WorkCardController.apply( this, args );
      // log
      console.log('render card by number page');
    }

    nestedRoute () {

      // get args
      // let args = Array.prototype.slice.call(arguments);

      // call nested controller
      // NestedController.apply(this, args);

      // log
      console.log('render nested route page');
    }

    apikey () {

      // get args
      // let args = Array.prototype.slice.call(arguments);

      // call gauges controller
      // GaugesController.apply(this, args);

      // log
      console.log('render other pages (gauges) page');
    }
  };
};
