'use strict';

// lodash functions
var compact             = require( 'lodash/compact' );

// exports route controller
export default ($, Backbone, Const, SowCardModel, BaseCardView, utils, session) => {

  // return route controller
  return function(workTaskKey, requestKey, cardNo) {

    // get arguments real array
    var args = compact( Array.prototype.slice.call(arguments) );

    // define path
    var pagePath = 'wc/' + args.join( '/' );

    // get online state
    var isOnline = session.get( 'app', 'connection' ) == Const.NET_CONNECTED;

    // define default previous route
    // var previousRoute = 'w/' + workTaskKey;
    var previousRoute = session.get( 'cache', 'page' );

    // get layout
    var layout = utils.getLayoutBy( 'requestKey', requestKey );

    // prevent route when no layout available
    if ( !layout ) {

      // toast
      $.publish( 'toast', [2, 'No layout available!'] );

      // navigate
      Backbone.history.navigate( workTaskKey, { trigger: true } );

      // resume
      return;
    }

    // get current connection state
    var connection = session.get( 'app', 'connection' );

    // css class
    var apikeyClass = 'sowcard';

    // get card state
    var cardState = session.get( 'card', layout.requestKey );

    // check card state
    if ( typeof cardState == 'undefined' ) {

      // update card state
      cardState = { active: 'thead' };
    }

    // sowcard model
    var apikeyModel = new SowCardModel({
      cardType: requestKey.indexOf('Breeding') > 0 ? 1 : 0,
      layout: layout,
      connection: connection,
      activeView: cardState.active,
      previousRoute: previousRoute
    });

    // create top view
    var apikeyView = new BaseCardView({
      model: apikeyModel,
      lang: this.appState.lang
    });

    // update navbar menu type
    var menuType = 3;

    // progress = true
    $.publish( 'progress', [true] );

    this.topView
      .fadeOut()
      .then(() => {

        // render view async
        return this.topView.renderView({
          type: menuType,
          page: apikeyClass,
          activeView: apikeyView
        });
      })
      .then(() => {

        // check state
        if ( isOnline ) {
          return apikeyView.
            getOnlineCard({
              value: cardNo,
              layout: layout,
              operation: '='
            });
        }

        return apikeyView
          .getOfflineCard({
            layout: layout.requestKey,
            number: cardNo
          }, {
            key: 'number',
            value: cardNo,
            layout: layout,
            operation: '='
          });
      })
      .then((data) => {

        // update class name
        this.topView.$( '#page-content' ).removeClass().addClass( 'container-fluid' );

        // render sowcard
        return apikeyView.renderData( data );
      })
      .catch((err) => {

        // progress = false
        $.publish( 'progress', [false] );

        // hide spinner
        $.publish( 'spinner', [false] );

        // toast
        $.publish( 'toast', [2, requestKey + ' error: ' + err.message || err.toString()] );
      })
      .finally(() => {

        // save current page into session
        session.set( 'cache', 'page', pagePath ).persist();

        // progress = false
        $.publish( 'progress', [false] );

        // hide spinner
        $.publish( 'spinner', [false] );

        // fade page in
        return this.topView.fadeIn();
      });
  };
};
