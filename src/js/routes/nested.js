'use strict';

// libs
import getProp from 'get-prop';

// lodash functions
import { isArray, isObject } from 'lodash';

// exports route controller
export default ($, Base64, Backbone, ProgenyModel, LocationOverview, utils, session ) => {

  // return routecontroller
  return function(hash) {

    // define fragment
    var fragment;

    try {

      // get fragment
      fragment = JSON.parse( Base64.decode(hash) );

      // log
      // console.log( JSON.stringify(fragment) );
    } catch(e) {

      // toast
      $.publish( 'toast', [2, 'SmartPigs navigation error! (Error: ' + e.message + ')'] );

      // navigate
      Backbone.history.navigate( 'mainmenu', { trigger: true } );

      // resume
      return;
    }

    // validate fragment
    if ( !isArray(fragment) || !fragment.length ) {

      // toast
      $.publish( 'toast', [2, 'SmartPigs navigation fragment error!'] );

      // navigate
      Backbone.history.navigate( 'mainmenu', { trigger: true } );

      // resume
      return;
    }

    // get details
    var details = fragment.pop();

    // validate details
    if ( !details || !isObject(details) ) {

      // toast
      $.publish( 'toast', [2, 'SmartPigs navigation route error!'] );

      // navigate
      Backbone.history.navigate( 'mainmenu', { trigger: true } );

      // resume
      return;
    }

    // log
    // console.log( 'nested route: ', JSON.stringify(details) );

    // get data
    var rowId = getProp( details, ['rowId'], -1 );
    var cIndex = getProp( details, ['cIndex'], -1 );
    var requestKey = getProp( details, ['requestKey'], '' );

    // validate requestKey
    if ( !requestKey.length || rowId < 0 || cIndex < 0 ) {

      // toast
      $.publish( 'toast', [2, 'SmartPigs error request!'] );

      // navigate
      Backbone.history.navigate( 'mainmenu', { trigger: true } );

      // resume
      return;
    }

    // get current connection state
    var connection = session.get( 'app', 'connection' );

    // create endPoint
    var endPoint = requestKey + '/' + rowId + '/' + cIndex;

    // get layout
    // var layout = utils.getLayoutBy( 'requestKey', requestKey );

    // get layouts
    var layouts = session.get( 'layouts' );

    // get nested layout
    var layout = utils.getNestedLayout( layouts, 'requestKey', endPoint );

    // check layout
    if ( !layout ) {

      // log
      // console.log('nested route -> no layout');

      // create new dynamic layout
      // layout = { requestKey: endPoint };

      // log
      // console.log('nested route -> no layout -> get normal layout');

      // get layout
      layout = utils.getLayoutBy( 'requestKey', requestKey );

      // check layout
      if ( !layout ) {

        // toast and resume to mainmenu
        $.publish( 'Layout not found by keys: [' + endPoint + ', ' + requestKey + ']!' );

        // navigate
        Backbone.history.navigate( 'mainmenu', { trigger: true } );

        // resume
        return;
      }
    }

    // create progeny model
    var dynamicModel = new ProgenyModel({
      layout: layout,
      connection: connection,
      dataType: 'json'
    });

    // view options
    var viewOpt = {
      model: dynamicModel,
      lang: this.appState.lang
    };

    // get dynamic view
    var dynamicView = new LocationOverview( viewOpt );

    // progress = true
    $.publish( 'progress', [true] );

    this.topView
      .fadeOut()
      .then(() => {
        return this.topView.renderView({
          type: 4,
          page: 'progeny',
          activeView: dynamicView
        });
      })
      .then(() => {

        // update class name
        this.topView.$( '#page-content' ).removeClass().addClass( 'container-fluid' );

        // fade page in
        return this.topView.fadeIn();
      })
      .then(() => {

        // save current page into session
        session.set( 'cache', 'page', 'n/' + hash ).persist();

        // progress = false
        $.publish( 'progress', [false] );

        // get data
        return dynamicView.getData({
          endPoint: endPoint,
          layout: layout
        });
      })
      .catch((err) => {

        // progress = false
        $.publish( 'progress', [false] );

        // toast
        $.publish( 'toast', [2, endPoint + ' error: ' + err.toString()] );

        // hide spinner
        $.publish( 'spinner', [false] );
      })
      .finally(() => {

        // hide spinner
        $.publish( 'spinner', [false] );
      });
  };
};
