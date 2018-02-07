'use strict';

// lodash helpers
import { assign, isFunction } from 'lodash';

// exports
export default ( $, axios, debug, Layout, Const, session, template ) => {

  // define cancel token
  var CancelToken = axios.CancelToken;

  // measure time
  // https://stackoverflow.com/questions/20618355/the-simplest-possible-javascript-countdown-timer#20618517
  // also check:
  // https://stackoverflow.com/questions/29971898/how-to-create-an-accurate-timer-in-javascript
  function countdownTimer(time, callback) {

    // save refference for the inner timer
    var innerTimer, outerTimer;

    // real time
    var realTime = Date.now() + time;

    // step interval in ms
    var stepInterval = 1000;
    var expected = Date.now() + stepInterval;

    // clear timers
    function clearTimers() {

      // log
      console.log('clear timers');

      // clear timers
      clearTimeout(innerTimer);
      clearTimeout(outerTimer);
    }

    // define step function
    function step() {

      // the drift (positive for overshooting)
      var dt = Date.now() - expected;

      // something really bad happened. Maybe the browser (tab) was inactive?
      // possibly special handling to avoid futile "catch up" run
      // if (dt > stepInterval) {}

      // time is up
      if (realTime - expected < 1000) {

        // log
        // console.log('realTime:' + realTime + ', expected: ' + expected + ', delta = ' + (expected-realTime));

        // clear timers
        clearTimers();

        // do work
        callback();

        // resume
        return;
      }

      // update expected
      expected += stepInterval;

      // take drift into account
      innerTimer = setTimeout(step, Math.max(0, stepInterval - dt));

      // resume
      return innerTimer;
    }

    // run countdown timer
    // setTimeout(step, stepInterval);
    outerTimer = setTimeout(step, stepInterval);

    // resume
    return clearTimers;
  }

  // resume
  return class V extends Layout {

    constructor(o) {
      super(assign({
        el: false,
        // template: Templates.hbs.whiteboard,
        template
      }, o));
    }

    initialize() {

      // start listening
      this.startListening();
    }

    startListening() {

      // subscribe for refresh-whiteboard events
      $.subscribe( 'refresh-whiteboard', this.refreshData.bind(this) );

      // subscribe for login-success events
      $.subscribe( 'login-success', this.refreshData.bind(this) );
    }

    stopListening() {

      // subscribe for refresh-whiteboard events
      $.unsubscribe( 'refresh-whiteboard' );

      // subscribe for login-success events
      $.unsubscribe( 'login-success' );
    }

    refreshData() {

      // show spinner
      $.publish( 'spinner', [true] );

      // reset timers
      this.resetTimers();

      // get start time
      var startTime = Date.now();

      // refresh data
      return this
        .getData()
        .then(this.processResponse.bind(this))
        .then(this.renderWhiteboard.bind(this))
        .then(function() {

          // hide spinner
          $.publish( 'spinner', [false] );

          // stop time
          var stopTime = Date.now();

          // resume
          return (stopTime - startTime);
        })
        .then(this.setRefreshRate.bind(this))
        .catch(this.handleRefreshError.bind(this));
    }

    getData() {

      // save context
      var _ctx = this;

      // get credentials
      var credentials = session.get( 'cache', 'credentials' );

      // update route
      var route = 'get.html?' + session.get( 'layouts', 'sessionKey' ) + '?Whiteboard?' + credentials.layoutName;

      // define timeout (3 minutes)
      // var timeout = 5 * 60 * 1000;
      var timeout = 3 * 60 * 1000;

      // define request source
      this.axiosSource = CancelToken.source();

      // define request config
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: timeout,
        cancelToken: this.axiosSource.token
      };

      // returns a promise
      return axios
        .post(route, credentials, config)
        .then(function(response) {

          // reset axios source
          _ctx.axiosSource = null;

          // delete axiosSource
          delete _ctx.axiosSource;

          // resume
          return response.data;
        })
        // .catch(function(response){
        .catch(function(err){

          // define more meaningfull message
          var msg;

          // handle axios error
          if (err.response) {

            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            // console.log(err.response.data);
            // console.log(err.response.status);
            // console.log(err.response.headers);
            msg = 'Timeout error or no connection! (status code not in 2xx range: ' + err.response.data + ')';
          } else if (err.request) {

            // The request was made but no response was received
            // `err.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            // console.log(err.request);
            msg = 'Request error: no response received!';
          } else {

            // Something happened in setting up the request that triggered an Error
            // console.log('Error', err.message);
            msg = 'timeout or no connection!';
          }

          // log
          // console.log(err.config);

          // check axios response object schema
          // https://github.com/mzabriskie/axios#response-schema
          // response == undefined -> 404 (NetworkError)
          // console.log(response);

          // get connection type and custom error message
          // var connectionState = status == 'timeout' ? Const.NET_TIMEOUT : Const.NET_SERVER_DOWN;
          // var message = status == 'timeout' ? 'connection timeout' : 'no connection';

          // reject promise
          throw {
            type: 5,
            name: 'RequestError',
            // message: capitalize( 'no connection' ) + '!',
            message: msg,
            connectionState: Const.NET_SERVER_DOWN
          };
        });
    }

    processResponse(response) {

      // validate response
      if ( !response ) {
        throw {
          type: 3,
          source: 'Server',
          message: 'No data received!'
        };
      }

      // check response
      if ( response[0] == '!' ) {
        throw {
          type: 3,
          source: 'Server',
          message: response.substring( 1, response.length )
        };
      }

      // resume
      return response;
    }

    renderWhiteboard(result) {

      // update component
      this.$( '.whiteboard-component' ).html( result );

      // resume
      return true;
    }

    handleRefreshError(err) {

      // reset timers
      this.resetTimers();

      // TODO
      // cancel last request (do not handle it)
      this.cancelLastRequest();

      // hide spinner
      $.publish( 'spinner', [false] );

      // get message
      var errMessage = err.message || err.toString();

      // check error type
      switch( err.type ) {
      case 3:

        // check error
        if ( err.hasOwnProperty('message') && errMessage == 'nouser' ) {

          // delay show login dialog
          setTimeout(function() {

            // publish event
            $.publish( 'show-login-dialog' );
          }, 100);

          // resume
          return;
        }

        // toast
        $.publish( 'toast', [3, 'Whiteboard server error: ' + JSON.stringify(errMessage) ] );
        break;
      default:

        // toast
        $.publish( 'toast', [2, 'Whiteboard get data error: ' + JSON.stringify(errMessage) ] );
        break;
      }
    }

    setRefreshRate(delay) {

      // get refresh time
      var refreshTimeMin = session.get( 'cache', 'credentials', 'updateValue' );

      // check delay
      delay = delay || 0;

      // check updateValue
      if ( !refreshTimeMin ) {

        /**
         * toast and resume
         * do not automatically refresh
         * console.log('will not refresh automatically');
         *
         */
        return $.publish('toast', [0, 'No refresh!']);
      }

      // get refresh interval in ms (subtract delay to be sure)
      var refreshIntervalMs = refreshTimeMin * 60 * 1000 - delay;

      // do work
      this.clearTimers = countdownTimer( refreshIntervalMs, this.refreshData.bind(this) );
    }

    // reset countdown timers
    resetTimers() {

      // clear timers
      if ( isFunction(this.clearTimers) ) {

        // clear timers
        this.clearTimers();

        // nullify clear timers
        this.clearTimers = null;
      }

      // resume
      return true;
    }

    cancelLastRequest() {

      // cancel request
      if ( this.axiosSource ) {

        // cancel the request (the message parameter is optional)
        this.axiosSource.cancel('Operation canceled by the user.');
      }
    }

    cleanup() {

      // stop listening
      this.stopListening();

      // reset timers
      this.resetTimers();

      // cancel request
      this.cancelLastRequest();
    }
  };
};
