import _ from 'underscore';
import setValue from 'set-value';
import unsetValue from 'unset-value';
import isPojo from 'is-pojo';
import getProp from 'get-prop';
import mergeOptions from 'merge-options';

// local vars (this is the ultimate source of truth)
let lang;
let credentials = {};

// exports singleton pattern
// http://viralpatel.net/blogs/javascript-singleton-design-pattern/
// hard module dependencies are storage key, $.publish and config
export default (broker, storageKey, config) => {

  // define methods
  let extend = _.extend;
  let isArray = _.isArray;
  let isEmpty = _.isEmpty;

  // persistence class
  class Persistence {
    constructor (sKey, conf) {

      // if not called as a constructor
      if (!(this instanceof Persistence)) {
        throw new TypeError('Session constructor cannot be called as a function.');
      }

      // init storage key
      this.storageKey = sKey || 'SmartPigs';

      // init session
      this.init(conf);

      // chaining api
      return this;
    }

    // initialize
    init (config) {

      // update config credentials
      extend(config.cache.credentials, credentials);

      // update language
      config.settings.lang = lang || 'en-us';

      // update language if older
      if (config.settings.lang === 'en' || config.settings.lang === 'dk') {

        // update lang to the correct lang
        config.settings.lang = 'en-us';
      }

      // local vars
      this._session = localStorage.getItem(this.storageKey);

      // check if any saved settings
      if (typeof this._session === 'string' && this._session.length) {
        try {

          // redefine session object
          this._session = JSON.parse(this._session);
        } catch (e) {

          /* // toast and resume
          return $.publish('smartpigs', ['toast', {
            type: 3,
            message: 'JSON parse error! @persistence-layer->init()'
          }]); */

          // emit toast event
          broker.emit('toast', {
            type: 3,
            message: 'JSON parse error! @persistence-layer->init()'
          });
        }
      }

      // if no backup session has been found -> create new _session
      if (!isPojo(this._session)) {

        // deep clone default properties
        // this._session = $.extend(true, {}, config);
        this._session = mergeOptions({}, config);

        // save device width and height
        this._session.device.width = global.innerWidth || global.document.documentElement.clientWidth || global.document.body.clientWidth;
        this._session.device.height = global.innerHeight || global.document.documentElement.clientHeight || global.document.body.clientHeight;

        // attach logs one time per app loading
        (function (store) {

          // get storedLogs (if any)
          let storedLogs = localStorage.getItem('_' + storageKey);

          // check if any stored logs
          if (typeof storedLogs === 'string' && storedLogs.length) {
            try {
              store.logs.concat(JSON.parse(storedLogs));
            } catch (e) {

              /* // toast and resume
              return $.publish('smartpigs', ['toast', {
                type: 2,
                message: 'JSON parse error! @Modules->persistence-layer.js:init()'
              }]); */

              // emit toast event
              broker.emit('toast', {
                type: 2,
                message: 'JSON parse error! @persistence-layer->init()'
              });
            }
          }
        })(this._session);
      } else {

        // overwrite version number with the config
        this._session.app.version = config.app.version;
      }

      // persist session into local storage
      this.persist();

      // listen for smartpigs events
      // should it be here?
    }

    /**
     * this function will get a value depending on
     * the passed key/nested keys. if no value has been found
     * return false;
     * Example:
     *    session.get();
     *    session.get( 'cache' );
     *    session.get( 'cache', 'credentials' );
     *    session.get( 'cache', 'credentials', 'user' );
     */
    get () {
      var args = Array.prototype.slice.call(arguments);

      // if no arguments passed
      if (!args.length || isEmpty(this._session)) return this._session;

      // get val
      return getProp(this._session, args);
    }

    /**
     * this function will set a value depending on the passed
     * keys (path/nested path) and will create nested paths if
     * the path is not available
     * Example:
     *     session.set('app', 'connection', 2);
     */
    set () {
      var args = Array.prototype.slice.call(arguments);

      // validate arguments
      if (args.length < 2) {
        throw new Error('Function called with missing arguments!');
      }

      // get path and value
      var value = args.pop();

      // create path
      var path = args.join('.');

      // set value
      setValue(this._session, path, value);

      // chaining api
      return this;
    }

    /**
     * this function will reset a value depending on
     * the passed key, or passed nested keys. reset values
     * are as following: -1 for number values,
     * '' for string values, false for boolean values,
     * and {} for object values;
     * Example:
     *    session.reset( 'cache' );
     *    session.reset( 'cache', 'credentials' );
     *    session.reset( 'cache', {} );
     *    session.reset( 'cache', 'credentials', 'user' );
     */
    reset () {
      let args = Array.prototype.slice.call(arguments);

      // no args -> reset
      if (!args.length) {

        // get credentials
        credentials = this.get('cache', 'credentials');

        // get previous language
        lang = this.get('settings', 'lang');

        // clear session storage
        this.clear();

        // init
        this.init(config);

        // resume
        return this;
      }

      // get path
      var path = args.join('.');

      // get reset value
      var resetVal = this.get.apply(this, args);

      // check reset value
      if (typeof resetVal === 'undefined') return false;

      // check default value type
      switch (typeof resetVal) {
        case 'string':
          resetVal = '';
          break;
        case 'number':
          resetVal = -1;
          break;
        case 'boolean':
          resetVal = false;
          break;
        case 'object':
          // resetVal = {};
          resetVal = isArray(resetVal) ? [] : {};
          break;
      }

      // unset value
      unsetValue(this._session, path);

      // set value back
      this.set(path, resetVal);

      // chaining api
      return this;
    }

    persist () {

      // update local storage
      localStorage.setItem(this.storageKey, JSON.stringify(this._session));

      // resume
      return this;
    }

    clear () {

      // remove only the current item key storage
      localStorage.removeItem(this.storageKey || 'SmartPigs');

      // reset session object
      this._session = null;

      // chaining api
      return this;
    }
  }

  // create namespace
  return new Persistence(storageKey, config);
};
