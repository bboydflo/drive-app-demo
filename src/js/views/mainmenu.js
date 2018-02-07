'use strict';

// libs
import getProp from 'get-prop';

// lodash functions
import { map, filter, assign, isPlainObject } from 'lodash';

// exports
export default ($, Layout, Backbone, Const, template, Language, BluetoothModal, utils, session) => {

  // return mainmenu view
  return class V extends Layout {

    constructor(o) {
      super(assign({

        // no wrapping element
        el: false,

        // default popup state
        popup: false,

        // define view template
        template: template,

        // define view events
        events: {
          'click .list-group-item': 'navigate'
        }
      }, o));
    }

    initialize() {

      // listen for custom events
      this.on( 'back', this.onBack, this );
      this.on( 'bluetooth', this.onBluetooth.bind(this) );
    }

    serialize() {
      var colSpan,
        colSpans = [4, 6, 12],
        mainHTML = {column: []};

      // mainmenu model
      var model = this.model.toJSON();

      // map through each layouts side
      mainHTML.column = filter(model, (value) => {

        // filter plain objects
        if ( isPlainObject(value) ) {

          // filter out empty columns
          if ( getProp(value, ['items'], []).length ) {

            // update col span
            colSpan = colSpans.pop();

            // return value
            return value;
          }
        }

        // filter out
        return false;
      });

      // update visible columns with appropriate class
      map( mainHTML.column, function(col) {
        col.class = 'col-md-'+ colSpan +' col-sm-' + colSpan;
      });

      // resume
      return mainHTML;
    }

    afterRender() {

      // init android
      $.publish( 'init-android' );
    }

    navigate(e) {

      // prevent default event and stop event propagation]
      e.preventDefault();
      e.stopPropagation();

      var target = this.$( e.currentTarget ).find( 'a' );

      // get apikey
      var apikey = target.data( 'apikey' );

      // route prefix (default progeny)
      var route_prefix = 'p/';

      // route suffix
      var route_suffix = '';

      // has card
      if ( apikey.toLowerCase().indexOf('card') >= 0 ) {

        // update route_prefix
        route_prefix = 'c/';

        // update suffix
        route_suffix = '/last';
      } else {

        // get layout
        var layout = utils.getLayoutBy( 'requestKey', apikey );

        // get update mode
        var updateMode = getProp( layout, ['updateMode'], 0 );

        // if worktask
        if ( updateMode ) {

          // update route_prefix
          route_prefix = 'w/';
        }
      }

      // offline mode
      if ( session.get( 'app', 'connection' ) > Const.NET_CONNECTED ) {

        // validate offline key
        if( target.data('offlinekey') ) {

          // trigger forward event using apikey
          Backbone.history.navigate( route_prefix + apikey + route_suffix, { trigger: true } );
        } else {

          // labels
          var t1 = session.get( 'sp_lang', 'SP_Toast7') || Language.toast['7'][this.lang];

          // toast
          $.publish( 'toast', [ 2, t1 ] );

          // resume
          return;
        }
      }

      // trigger forward event using apikey
      Backbone.history.navigate( route_prefix + apikey + route_suffix, { trigger: true } );
    }

    // need to implement this common function for the top views
    isDirty() {

      // resume
      return false;
    }

    /**
     * on back handler
     * @param  {object} ev - event object (unused)
     * @return {undefined}
     */
    onBack() {

      // check popup state
      if ( !this.popup ) {

        // navigate to previous route
        Backbone.history.navigate( this.previousRoute, { trigger: true } );

        // resume
        return;
      }

      // get current modal
      var btModal = this.getView( '.modal-view' );

      // check btModal state
      if ( !btModal ) {

        // toast and resume
        return $.publish( 'toast', [2, 'popup active but no current dialog instance!'] );
      }

      // toggle bluetooth modal
      btModal.toggle();
    }

    onBluetooth() {

      // get modal-view
      var btModal = this.getView( '.modal-view' );

      // check if active modal is a bluetooth modal
      // if ( btModal && btModal instanceof BluetoothModal ) {
      if ( btModal ) {

        // toggle bluetooth modal
        btModal.toggle();

        // resume
        return;
      }

      // get bluetooth modal
      btModal = BluetoothModal( this.lang );

      // listen for custom events
      btModal.on('hidden', this.togglePopup.bind(this) );
      btModal.on('visible', this.togglePopup.bind(this) );

      // set dialog view
      this.setView( '.modal-view', btModal );

      // render session modal and resume
      btModal.render();
    }

    togglePopup(popup) {

      // check popup state
      if ( typeof popup == 'undefined' ) {

        // update popup flag
        this.popup = !this.popup;
      } else {

        // get state from the upper component
        this.popup = popup;
      }
    }
  };
};
