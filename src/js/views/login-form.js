'use strict';

// lodash functions
import { assign, throttle } from 'lodash';

// exports
export default ($, Layout, Language, tpl, session, Const ) => {

  /**
   * cs;Český;Česká republika
   * da;Dansk;Danmark
   * de;Deutch;Deutchland
   * en-gb;English GB;Great Britain
   * en-ph;English PH;Philippines
   * en-us;English US;USA
   * en-au;English AU;Australia
   * es;Español;España
   * et;Eesti;Eesti
   * fi;Suomi;Suomi
   * ja;日本人;日本
   * nl;Nederlands;Nederland
   * no;Norsk;Norge
   * pl;Polski;Polska
   * ru;Pусский;Россия
   * sv;Svenska;Sverige
   * uk;Український;Україна
   * zh;中国的;中国
   * th;ไทย;ประเทศไทย
   * mk;македонски;Македонија
   * sr;Србин;Србија
   * bg;български;България
   * vi;Tiếng Việt;Việt Nam
   */

  // countries array
  var countriesArray = [
    {'US': 'English US'},
    {'JP': '日本人'},
    {'DK': 'Dansk'},
    {'NL': 'Nederlands'},
    {'DE': 'Deutsch'},
    {'CZ': 'Český'},
    {'GB': 'English GB'},
    {'PH': 'English PH'},
    {'AU': 'English AU'},
    {'ES': 'Español'},
    {'EE': 'Eesti'},
    {'FI': 'Suomi'},
    {'BG': 'български'},
    {'NO': 'Norsk'},
    {'PL': 'Polski'},
    {'RU': 'Pусский'},
    {'SE': 'Svenska'},
    {'UA': 'Український'},
    {'CN': '中国的'},
    {'TH': 'ไทย;ประเทศไทย'},
    {'MK': 'македонски'},
    {'RS': 'Србин'},
    {'VN': 'Tiếng Việt'}
  ];

  // throttled listener
  // http://devdocs.io/lodash~4/index#throttle
  var throttled = throttle(function( ev ) {

    // check key
    if ( ev.which !== 13 ) {

      // update field
      this.updateField( ev );

      // resume
      return;
    }

    // attempt to login
    this.trigger( 'login', ev );
  }, 300);

  // define login form
  return class V extends Layout {
    constructor(options) {
      super(options);

      // check backbone.layoutmanager docs
      this.el = false;

      // template (Templates.hbs.loginForm)
      this.template = tpl;

      // define events
      this.events = {
        'change .form-control': 'updateField',
        'click .close': 'hideError',
        'keyup .form-control': 'keyup'
      };

      // throttled event listener
      // gets called at most once per 300 ms
      this.keyup = throttled;
    }

    initialize() {

      // listen for model changes
      // this.listenTo( this.model, 'change', this.render, this );

      // listen for 'clear' event
      this.on( 'clear', this.clearEvent );
    }

    serialize() {
      var key,
        lang = this.lang;

      // loop through programCountriesMap
      for(key in Const.PROGRAM_COUNTRIES_MAP) {
        if (Const.PROGRAM_COUNTRIES_MAP[key] == lang) {
          break;
        }
      }

      // labels
      var v1 = session.get( 'sp_lang', 'SP_IndexDatabase') || Language.index.database[lang];
      var v2 = session.get( 'sp_lang', 'SP_IndexUser') || Language.index.user[lang];
      var v3 = session.get( 'sp_lang', 'SP_IndexPassword') || Language.index.password[lang];

      // resume
      return assign({}, this.model.toJSON(), {
        placeholderDb: v1,
        placeholderUser: v2,
        placeholderPass: v3,
        defLang: key || 'US'
      });
    }

    afterRender() {

      // call placeholder plugin
      var $inputs = this.$( '.form-control' );

      // apply placeholder plugin
      $inputs.each(function () {

        // placeholder
        $(this).placeholder();
      });

      // get current language
      var lang = this.lang;

      // labels
      var v4 = session.get( 'sp_lang', 'SP_LabelsProgLang') || Language.labels.progLang[lang];

      // flagstrap placeholder
      var placeholder = { text: v4 };

      // sort countries array
      countriesArray.sort(function(a, b) {
        var key1 = Object.keys(a)[0];
        var val1 = a[key1].toUpperCase();
        var key2 = Object.keys(b)[0];
        var val2 = b[key2].toUpperCase();
        if (val1 < val2) {
          return -1;
        }
        if (val1 > val2) {
          return 1;
        }

        // names must be equal
        return 0;
      });

      // apply flagstrap plugin
      // https://github.com/blazeworx/flagstrap
      $('.flagstrap').flagStrap({
        countries: countriesArray,
        placeholder: placeholder,
        onSelect: function (value, element) {

          // get flagster selected value ['US', 'DK', 'NL', 'DE', 'GB' ... ]
          var sel = $(element).children('option[selected=selected]').val();

          // check if empty
          if ( !sel ) {

            // resume
            return;
          }

          // smartpigs user interface options
          var defLangMap = {
            'US': 'en-us',
            'DK': 'da',
            'NL': 'nl',
            'DE': 'de'
          };

          // update program language anyway
          session.set( 'settings', 'lang', Const.PROGRAM_COUNTRIES_MAP[sel] ).persist();

          // program interface language
          var progLang = defLangMap[sel] || 'en-us';

          // trigger language-change
          $.publish( 'language-change', progLang );
        }
      });
    }

    getData() {

      // get model
      var model = this.model.toJSON();

      // resume
      return {
        database: model.database.replace(' ', '').toLowerCase(),
        databasePW: model.databasePW.replace(' ', '').toLowerCase(),
        user: model.user.replace(' ', '').toLowerCase(),
        userPW: model.userPW.replace(' ', '').toLowerCase()
      };
    }

    updateField( ev ) {

      // local vars
      var key,
        $target = this.$( ev.currentTarget ),
        id      = $target.attr( 'id' ),
        value   = $target.val();

      // switch id
      switch( id ) {
      case 'field1':
        key = 'database';
        break;
      case 'field2':
        key = 'databasePW';
        break;
      case 'field3':
        key = 'user';
        break;
      case 'field4':
        key = 'userPW';
        break;
      }

      // update model key
      this.model.set( key, value );
    }

    clearEvent(){

      // cleared model
      var clearedModel = {
        database: '',
        databasePW: '',
        user: '',
        userPW: ''
      };

      // remove credentials from cache
      session.set( 'cache', 'credentials', clearedModel );

      // persist session
      session.persist();

      // update model triggers refresh
      this.model.set( clearedModel );

      // rerender view
      this.render();
    }
  };
};
