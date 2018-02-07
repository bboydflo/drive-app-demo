'use strict';

// lodash functions
import { compact } from 'lodash';

// exports route controller
export default ($, Backbone, Const, SowCardModel, BaseCardView, utils, session) => {

  // return  route controller
  return function(requestKey, cardNo) {

    // get arguments real array
    var args = compact( Array.prototype.slice.call(arguments) );

    // define path
    // var pagePath = 'c/' + requestKey + '/' + cardNo;
    var pagePath = 'c/' + args.join( '/' );

    // get online state
    var isOnline = session.get( 'app', 'connection' ) == Const.NET_CONNECTED;

    // define default previous route
    var previousRoute = session.get( 'cache', 'page' );

    // get layout
    var layout = utils.getLayoutBy( 'requestKey', requestKey );

    // prevent route when no layout available
    if ( !layout ) {

      // toast
      $.publish( 'toast', [2, 'No layout available!'] );

      // navigate
      Backbone.history.navigate( 'mainmenu', { trigger: true } );

      // resume
      return;
    }

    // get current connection state
    var connection = session.get( 'app', 'connection' );

    // css class
    var apikeyClass = 'sowcard';

    // get card state
    var cardState = session.get( 'card', layout.requestKey ) || { active: 'thead' };

    // card model
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

        // spinner = true
        $.publish( 'spinner', [true] );

        // check state
        if ( isOnline ) {
          return apikeyView.
            getOnlineCard({
              value: cardNo,
              layout: layout,
              operation: '='
            });
        }

        // get last card number
        return apikeyView
          .getLastCardIndex(requestKey)
          .then((cardIndex) => {

            // and then get card number
            return apikeyView.getOfflineCard({
              index: cardIndex
            }, {
              layout: layout,
              key: 'index',
              value: cardIndex
            });
          });
      })
      .then((data) => {

        // update class name
        this.topView.$( '#page-content' ).removeClass().addClass( 'container-fluid' );

        // update path
        pagePath = 'c/' + requestKey + '/' + data.number;

        // update fragment
        Backbone.history.navigate( pagePath, {replace: true} );

        // render sowcard
        return apikeyView.renderData( data );
      })
      .catch((err) => {

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
