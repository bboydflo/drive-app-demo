import 'whatwg-fetch';
import mitt from 'mitt';
// import Dexie from 'dexie';
// import Backbone from 'backbone';
import Backbone from '../vendor/my-backbone-router';
import browserLanguage from 'get-browser-language';

// Promise/A+ api
// import { Promise as P } from 'rsvp';
import { Promise as P } from 'promise-polyfill';

// stacktrace libs
import StackTrace from 'stacktrace-js';
import StackTraceGPS from 'stacktrace-gps';

// needed to mount the router component
import { h, render } from 'preact';

// react-dom (what we'll use here)
// import { BrowserRouter } from 'react-router-dom';

// modules
// import pMap from './p-map';
// import Toast from './toast';
import Utils from './utilities';
import Config from './config';
// import DataApi from './data-api';
// import Language from './lang.js';
import parseUri from './parseUri';
// import Constants from './constants';
import pdfSupport from './pdf-native-support';
import updateCache from './update-cache';
import MenubarModule from './menubar';
import isIeSupported from './is-ie-supported';
import globalNamespace from './globals-and-namespace';
// import PersistenceLayer from './persistence-layer';
import globalErrorHandler from './global-error-handler';
// import DbConnectionFactory from './db-connection';

// router
/* import RouterFactory from '../routes/router';
import DemoControllerF from '../routes/demo';
import IndexControllerF from '../routes/index';
import SettingsControllerF from '../routes/settings';
import MainmenuControllerF from '../routes/mainmenu';
import SimpleSpreadControllerF from '../routes/simple-spread'; */

// controllers
import loginController from '../controllers/login';

// views
import LoginPageFactory from '../components/login-page';
// import DemoPageFactory from '../components/demo';
import SettingsPageFactory from '../components/settings-page';
import MainmenuPageFactory from '../components/mainmenu-page';
// import SimpleSpreadPageFactory from '../components/simple-spread';

// app
import AppRouterFactory from '../routes/app';

// store
import { configureStore } from '../store/index';

export default () => {

  // TODO: show toast
  if (!isIeSupported()) return;

  // add promise support for browsers that are not supporting promises
  if (!global.Promise) {
    global.Promise = P;
  }

  // global emitter (pubsub)
  let broker = mitt();

  // define storage key
  const STORAGE_KEY = 'SmartPigs';

  // create namespace, returns env object
  let env = globalNamespace(`_${STORAGE_KEY}`);

  // is in production mode
  let isProduction = false;

  // get production flag in environment
  if (process.env.NODE_ENV === 'production') {

    // update flag
    isProduction = true;
  }

  // update version
  const version = process.env.version;

  // current url
  const cUrl = global.location.href || global.document.URL;

  // get url parsed object
  const url = parseUri(cUrl);

  // get url props
  const urlProps = {
    port: url.port,
    host: url.host,
    protocol: url.protocol
  };

  // get initial state object
  const config = Config(isProduction, STORAGE_KEY, version, urlProps, pdfSupport());

  // get store
  let store = configureStore(config);

  // log
  console.log(store);

  // polyfill global $.publish method
  global.$ = {
    publish: function (evName, evPayload) {
      console.log(evName, evPayload);
      broker.emit(evName, evPayload);
    }
    /* subscribe: function (a, b) {
      console.log(a, b);
    } */
  };

  // setup toast listener
  broker.on('smartpigs', (evPayload) => {
    console.log(`${evPayload[0]} with options ${JSON.stringify(evPayload[1])}`);
  });

  // initialize persistence layer
  // let session = PersistenceLayer(broker, STORAGE_KEY, config);

  // add session object to the global namespace
  // env.session = session;

  // get browser language
  env.locale = browserLanguage();

  // add $ to the global scope
  // env.$ = $;

  // setup global error handler
  global.onerror = globalErrorHandler(broker, StackTrace, StackTraceGPS);

  // setup app cache
  // listen for applicationCache "UPDATEREADY" event
  // const onUpdateReady = updateCache(broker, session);
  const onUpdateReady = updateCache(broker, 1);
  global.applicationCache.addEventListener('updateready', onUpdateReady);
  if (window.applicationCache.status === window.applicationCache.UPDATEREADY) {
    onUpdateReady();
  }

  // get database api
  // const dbApi = DbConnectionFactory(Dexie, isProduction);

  // main database connection
  // const smartPigsDbConnection = dbApi.get(STORAGE_KEY, Constants.DB_TABLES);

  // get data api
  // const dataApi = DataApi(smartPigsDbConnection);

  // get utils
  // const utils = Utils(MenubarModule, session);
  const utils = Utils(MenubarModule, store);

  // get login api
  // const loginApi = loginController(session);
  const loginApi = loginController(store);

  // get view
  // const LoginPage = LoginPageFactory(Backbone, broker, loginApi, utils, session);
  const LoginPage = LoginPageFactory(Backbone, broker, loginApi, utils, store);

  // get index controller
  // const IndexController = IndexControllerF(LoginPage, session);

  // get necesary views
  // const DemoPage = DemoPageFactory(session);

  // get demo controller
  // const DemoController = DemoControllerF(DemoPage, session);

  // top settings page
  // const SettingsPage = SettingsPageFactory(session);
  const SettingsPage = SettingsPageFactory(store);

  // get settings controller
  // const SettingsController = SettingsControllerF(SettingsPage, session);

  // top mainmenu page
  // const MainmenuPage = MainmenuPageFactory(Backbone, broker, loginApi, utils, session);
  const MainmenuPage = MainmenuPageFactory(Backbone, broker, loginApi, utils, store);

  // get mainmenu controller
  // const MainmenuController = MainmenuControllerF(MainmenuPage, session);

  // create simple-spread top view
  // const SimpleSpreadPage = SimpleSpreadPageFactory(Backbone, broker, dataApi, loginApi, utils, session);

  // base spread controller
  // const SimpleSpreadController = SimpleSpreadControllerF(SimpleSpreadPage, utils, session);

  // init router
  // eslint-disable-next-line
  // new AppRouter();

  // start listenig for route changes
  // Backbone.history.start();

  // get app
  // const App = AppRouterFactory(broker, session, LoginPage, SettingsPage, MainmenuPage);

  // mount router component
  // render(<App session={session} />, document.getElementById('app'));

  /* // listen to all events
  broker.on('*', (type, e) => console.log(type, e));

  // fire an event
  broker.emit('foo', { a: 'b' }); */

  /* // global $.publish example
  global.$.publish('smartpigs', ['toast', {
    type: 3,
    message: 'JSON parse error! @persistence-layer->init()'
  }]); */

  // hide spinner
  global._SmartPigs.spinner.hide();
};
