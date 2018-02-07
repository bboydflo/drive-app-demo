'use strict';

// lodash functions
import { assign, throttle, capitalize } from 'lodash';

// exports
export default ( $, Layout, Language, template, session ) => {

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

    constructor(o) {
      super(assign({
        el: false,
        template: template, // Templates.hbs.whiteboardLoginForm,
        events: {
          'click .close': 'hideError',
          'keyup .form-control': 'keyup',
          'change .form-control': 'updateField'
        },
      }, o));
    }

    serialize() {
      var lang = this.lang;

      // labels
      var v1 = session.get( 'sp_lang', 'SP_IndexDatabase') || Language.index.database[lang];
      var v2 = session.get( 'sp_lang', 'SP_IndexUser') || Language.index.user[lang];
      var v3 = session.get( 'sp_lang', 'SP_IndexPassword') || Language.index.password[lang];

      var updateOptions = [
        { value: 0, label: 'none' },
        { value: 15, label: 15 },
        { value: 30, label: 30 },
        { value: 60, label: 60 }
      ];

      // get current update time
      var updateTime = session.get( 'cache', 'credentials', 'updateValue' );

      // position
      var foundPosition = -1;

      // update value
      var savedValue = { value: null, label: null };

      // loop through update options
      for ( var i=0; i<updateOptions.length; i++ ) {

        if ( updateTime === updateOptions[i].value ) {

          // update found position
          foundPosition = i;

          // resume loop
          break;
        }
      }

      // check found position
      if ( foundPosition > -1 ) {

        // update options
        savedValue = updateOptions.splice( i, 1 );

        // update element
        updateOptions.unshift( savedValue[0] );
      }

      // serialized object
      return assign({}, this.model.toJSON(), {
        placeholderDb: v1,
        placeholderUser: v2,
        placeholderPass: v3,
        placeholderLayout: Language.index.layoutName[lang],
        updateTime: capitalize( Language.index.updateTime[lang] ),
        updateOptions: updateOptions
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
    }

    getData() {

      // get model
      var model = this.model.toJSON();

      // get update time value
      var updateValue = parseInt( this.$( '#field6' ).val(), 10 );

      // resume
      return {
        database: model.database.replace(' ', '').toLowerCase(),
        databasePW: model.databasePW.replace(' ', '').toLowerCase(),
        user: model.user.replace(' ', '').toLowerCase(),
        userPW: model.userPW.replace(' ', '').toLowerCase(),
        layoutName: model.layoutName,
        updateValue: updateValue || model.updateValue
      };
    }

    // throttled event listener
    // gets called at most once per 300 ms
    keyup() {

      // get args
      throttled.call(this, ...arguments);
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
      case 'field5':
        key = 'layoutName';
        break;
      case 'field6':
        key = 'updateValue';
        value = parseInt( value, 10 );
        break;
      }

      // update model key
      this.model.set( key, value );
    }
  };
};
