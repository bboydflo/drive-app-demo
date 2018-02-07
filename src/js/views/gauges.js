'use strict';

// libs
import getProp from 'get-prop';

// singleton vars
var log;

// exports
export default ($, debug, Layout, Backbone, Base64, template, gaugePlaceholderTpl, utils, session) => {

  // return gauges view
  return class V extends Layout {

    constructor(o) {
      super(o);

      // no element wrapping this view
      this.el = false;

      // popup state
      this.popup = false;

      // default number of gauges
      this.counter = -1;

      // templating function
      this.template = template; // Templates.hbs['gauges-container'];
    }

    // overwrite parent method
    initialize() {

      // init log
      log = debug( 'Gauges' );

      // listen for 'back' events
      this.on( 'back', this.onBack, this );
    }

    // overwrite render
    serialize() {
      var layout = this.model.get( 'layout' );

      // render properties
      return {
        title: layout.title || 'Gauges',
        id: 'gauges'
      };
    }

    afterRender() {

      // init android
      $.publish( 'init-android' );
    }

    // need to implement this common function for the top views
    isDirty() {

      // resume
      return false;
    }

    togglePopup( popup ) {

      // check popup state
      if ( typeof popup == 'undefined' ) {

        // update popup flag
        this.popup = !this.popup;
      } else {

        // get state from the upper component
        this.popup = popup;
      }
    }

    // getData( requestKey ) {
    getData( obj ) {
      var _self = this;

      // endPoint
      var endPoint = getProp( obj, ['endPoint'] );

      // show spinner
      $.publish( 'spinner', [true] );

      // get number of gauges
      return this
        .getNumberOfGauges(endPoint)
        .then(function(counter){
          var i,
            requests = [];

          // loop
          for ( i=0; i<counter; i++ ){

            // request gauge
            requests.push( _self.requestGauge(i, endPoint, counter) );
          }

          // loop through each request in the array
          return Promise.each(requests, function(arr) {

            // display gauge
            return _self.displayGauge( arr );
          });
        })
        .catch(function(err){

          // hide spinner
          $.publish( 'spinner', [false] );

          // toast
          $.publish( 'toast', [2, 'Error: ' + err.message + ' @Gauges->getData!'] );

          // log
          log( err );
        });
    }

    getNumberOfGauges( requestKey ) {

      // returns promise
      return new Promise(function(resolve, reject){

        // init server address
        var server_address = session.get( 'device', 'server_address' ) || '/';

        // request number of gauges
        $.ajax({
          type: 'POST',
          url: server_address + 'gauges/?' + session.get( 'layouts', 'sessionKey' ) + '?' + requestKey,
          crossdomain: true
        }).done(function(response) {

          // validate response
          if ( isNaN(response) ) {

            // reject promise
            return reject( new Error(response) );
          }

          // get counter
          var counter = parseInt( response, 10 );

          // resolve promise
          resolve( counter );
        }).fail(function() {

          // call ajax fail
          var connectionType = utils.ajaxFail.apply( null, arguments );

          // reject promise
          reject({
            type: 5,
            source: 'Server',
            connectionType: connectionType,
            message: 'No connection!'
          });
        });
      });
    }

    requestGauge( id, requestKey, counter ) {

      // return a promise
      return new Promise(function(resolve, reject){
        var last = false;

        // http request object
        var xhr = new XMLHttpRequest();

        // check if last request
        if ( id == counter - 1 ) {

          // last request
          last = true;
        }

        // open request
        xhr.open( 'POST', '/gauges/?' + session.get( 'layouts', 'sessionKey' ) + '?' + requestKey + '?' + id, true );

        // update response type
        if ( Modernizr['ie-support'] ) {
          xhr.responseType = 'arraybuffer';
        } else {
          xhr.overrideMimeType( 'text/plain; charset=x-user-defined' );
        }

        // http callbacks
        xhr.onerror = reject;
        xhr.onabort = reject;
        xhr.current = id;

        // on finished
        xhr.onload = function( e ) {

          // check response typw
          if ( Modernizr['ie-support'] ) {

            // get bytes
            var bytes = new Uint8Array( this.response );

            // display gauge
            return resolve([ id, bytes, 'IE', last ]);
          }

          // display gauge
          resolve([ id, e.currentTarget.responseText, '', last ]);
        };

        // send http request
        xhr.send( null );
      });
    }

    displayGauge( id, data, browser, last ) {
      var src,

        // reinit gauges
        gauges = $( '#gauges' );

      // check browser vendor
      if ( browser == 'IE' ) {
        src = 'data:application/octet-stream;base64,' + Base64.encode( data );
      } else if ( browser == 'firefox' ) {
        src = 'data:application/octet-stream;base64,' + utils.base64Encode( data );
      } else {
        src = 'data:image/png;base64,' + utils.base64Encode( data );
      }

      // append gauge
      gauges.append( gaugePlaceholderTpl({ src: src }) );

      // check if last gauge
      if ( last ) {

        // hide spinner
        $.publish( 'spinner', [false] );
      }
    }

    // on back handler
    onBack() {
      var activeModal;

      // check if any modal dialog is active
      if ( this.popup ) {

        // get active modal
        activeModal = this.getView( '.modal-view' );

        // check active modal
        if ( !activeModal ) {

          // toast and resume
          return $.publish( 'toast', [2, 'popup active but no current dialog instance!'] );
        }

        // toggle active modal
        activeModal.toggle();

        // resume
        return;
      }

      // navigate
      Backbone.history.navigate( 'mainmenu', { trigger: true } );
    }
  };
};
